import math
import logging
import requests
import json

logger = logging.getLogger(__name__)

class RouteService:
    """Service for calculating routes using OSRM API for real road routing"""
    
    def __init__(self):
        # OSRM server configuration
        # Using the public OSRM demo server - for production, you should host your own
        self.osrm_base_url = "https://routing.openstreetmap.de/routed-car"
        self.backup_osrm_url = "https://router.project-osrm.org"
        
        # Grid-based pathfinding parameters (fallback only)
        self.grid_resolution = 0.001  # Approximately 100m resolution
        self.max_route_distance = 100  # Maximum route distance in km
        
    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate haversine distance between two points"""
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        r = 6371  # Earth radius in km
        return c * r
    
    def get_osrm_route(self, start_coords, end_coords):
        """
        Get route from OSRM API using real road data
        
        Args:
            start_coords: [lat, lon] of start point
            end_coords: [lat, lon] of end point
            
        Returns:
            Dict with route data or None if failed
        """
        try:
            start_lat, start_lon = start_coords
            end_lat, end_lon = end_coords
            
            # OSRM expects coordinates in lon,lat format
            coordinates = f"{start_lon},{start_lat};{end_lon},{end_lat}"
            
            # Try primary OSRM server first
            url = f"{self.osrm_base_url}/route/v1/driving/{coordinates}"
            params = {
                'overview': 'full',
                'geometries': 'geojson',
                'steps': 'true',
                'annotations': 'true'
            }
            
            logger.info(f"Requesting OSRM route from {start_coords} to {end_coords}")
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 'Ok' and data.get('routes'):
                    return self.process_osrm_response(data)
                else:
                    logger.warning(f"OSRM returned no routes: {data.get('message', 'Unknown error')}")
            else:
                logger.warning(f"OSRM API request failed with status {response.status_code}")
                
        except requests.exceptions.Timeout:
            logger.warning("OSRM API request timed out")
        except requests.exceptions.RequestException as e:
            logger.warning(f"OSRM API request failed: {e}")
        except Exception as e:
            logger.error(f"Error processing OSRM response: {e}")
            
        # Try backup server
        try:
            backup_url = f"{self.backup_osrm_url}/route/v1/driving/{coordinates}"
            response = requests.get(backup_url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 'Ok' and data.get('routes'):
                    logger.info("Successfully got route from backup OSRM server")
                    return self.process_osrm_response(data)
                    
        except Exception as e:
            logger.warning(f"Backup OSRM server also failed: {e}")
            
        return None
    
    def process_osrm_response(self, osrm_data):
        """
        Process OSRM API response and extract route information
        
        Args:
            osrm_data: Response from OSRM API
            
        Returns:
            Dict with processed route data
        """
        try:
            route = osrm_data['routes'][0]
            
            # Extract coordinates from geometry
            coordinates = route['geometry']['coordinates']
            # Convert from [lon, lat] to [lat, lon] format
            waypoints = [[coord[1], coord[0]] for coord in coordinates]
            
            # Extract route metrics
            distance_meters = route['distance']
            duration_seconds = route['duration']
            
            # Convert to our format
            distance_km = distance_meters / 1000
            duration_minutes = int(duration_seconds / 60)
            
            # Format estimated time
            if duration_minutes < 60:
                estimated_time = f"{duration_minutes} minutes"
            else:
                hours = duration_minutes // 60
                minutes = duration_minutes % 60
                estimated_time = f"{hours}h {minutes}m"
            
            # Extract turn-by-turn instructions
            instructions = []
            if 'legs' in route and route['legs']:
                leg = route['legs'][0]
                if 'steps' in leg:
                    instructions = self.extract_instructions_from_steps(leg['steps'])
            
            # If no detailed instructions, create basic ones
            if not instructions:
                instructions = self.generate_basic_instructions(waypoints)
            
            return {
                'waypoints': waypoints,
                'distance_km': round(distance_km, 2),
                'duration_seconds': duration_seconds,
                'estimated_time': estimated_time,
                'instructions': instructions,
                'source': 'osrm_api'
            }
            
        except Exception as e:
            logger.error(f"Error processing OSRM response: {e}")
            return None
    
    def extract_instructions_from_steps(self, steps):
        """Extract turn-by-turn instructions from OSRM steps"""
        instructions = []
        
        for i, step in enumerate(steps):
            try:
                maneuver = step.get('maneuver', {})
                maneuver_type = maneuver.get('type', 'continue')
                modifier = maneuver.get('modifier', '')
                
                # Get road name
                name = step.get('name', '')
                if not name or name == '':
                    name = 'unnamed road'
                
                # Get distance
                distance = step.get('distance', 0)
                
                # Create instruction text
                if i == 0:
                    instruction = "Start your journey"
                elif i == len(steps) - 1:
                    instruction = "Arrive at your destination"
                else:
                    instruction = self.format_instruction(maneuver_type, modifier, name, distance)
                
                instructions.append(instruction)
                
            except Exception as e:
                logger.warning(f"Error processing step {i}: {e}")
                instructions.append(f"Continue for {step.get('distance', 0):.0f} meters")
        
        return instructions
    
    def format_instruction(self, maneuver_type, modifier, road_name, distance):
        """Format a single turn instruction"""
        distance_text = f"{int(distance)}m" if distance < 1000 else f"{distance/1000:.1f}km"
        
        if maneuver_type == 'turn':
            if modifier == 'left':
                return f"Turn left onto {road_name}, continue for {distance_text}"
            elif modifier == 'right':
                return f"Turn right onto {road_name}, continue for {distance_text}"
            elif modifier == 'slight left':
                return f"Keep left onto {road_name}, continue for {distance_text}"
            elif modifier == 'slight right':
                return f"Keep right onto {road_name}, continue for {distance_text}"
            elif modifier == 'sharp left':
                return f"Sharp left onto {road_name}, continue for {distance_text}"
            elif modifier == 'sharp right':
                return f"Sharp right onto {road_name}, continue for {distance_text}"
        elif maneuver_type == 'continue' or maneuver_type == 'new name':
            return f"Continue on {road_name} for {distance_text}"
        elif maneuver_type == 'merge':
            return f"Merge onto {road_name}, continue for {distance_text}"
        elif maneuver_type == 'on ramp':
            return f"Take the ramp onto {road_name}, continue for {distance_text}"
        elif maneuver_type == 'off ramp':
            return f"Take the exit toward {road_name}, continue for {distance_text}"
        elif maneuver_type == 'fork':
            if modifier == 'left':
                return f"Keep left at the fork onto {road_name}, continue for {distance_text}"
            elif modifier == 'right':
                return f"Keep right at the fork onto {road_name}, continue for {distance_text}"
        elif maneuver_type == 'roundabout':
            return f"Enter roundabout and take exit onto {road_name}, continue for {distance_text}"
        
        # Default fallback
        return f"Continue on {road_name} for {distance_text}"
    
    def generate_basic_instructions(self, waypoints):
        """Generate basic instructions when detailed ones aren't available"""
        if len(waypoints) < 2:
            return ["No route available"]
        
        instructions = ["Start from your current location"]
        
        # Calculate total segments
        total_segments = len(waypoints) - 1
        
        if total_segments <= 3:
            instructions.append("Head directly towards the charging station")
        else:
            # Add intermediate instructions based on waypoint positions
            quarter_point = total_segments // 4
            half_point = total_segments // 2
            three_quarter_point = 3 * total_segments // 4
            
            if quarter_point > 0:
                instructions.append(f"Continue following the route")
            if half_point > quarter_point:
                instructions.append("You're halfway to your destination")
            if three_quarter_point > half_point:
                instructions.append("You're almost there, continue forward")
        
        instructions.append("Arrive at the charging station")
        return instructions
    
    def create_grid_node(self, lat, lon):
        """Create a grid node for pathfinding (fallback only)"""
        return {
            'lat': lat,
            'lon': lon,
            'g_cost': float('inf'),  # Cost from start
            'h_cost': 0,  # Heuristic cost to goal
            'f_cost': float('inf'),  # Total cost
            'parent': None,
            'visited': False
        }
    
    def get_neighbors(self, node, grid_bounds):
        """Get neighboring grid points for A* algorithm (fallback only)"""
        neighbors = []
        lat, lon = node['lat'], node['lon']
        
        # 8-directional movement
        directions = [
            (-self.grid_resolution, 0),  # North
            (self.grid_resolution, 0),   # South
            (0, -self.grid_resolution),  # West
            (0, self.grid_resolution),   # East
            (-self.grid_resolution, -self.grid_resolution),  # Northwest
            (-self.grid_resolution, self.grid_resolution),   # Northeast
            (self.grid_resolution, -self.grid_resolution),   # Southwest
            (self.grid_resolution, self.grid_resolution)     # Southeast
        ]
        
        for dlat, dlon in directions:
            new_lat = lat + dlat
            new_lon = lon + dlon
            
            # Check bounds
            if (grid_bounds['min_lat'] <= new_lat <= grid_bounds['max_lat'] and
                grid_bounds['min_lon'] <= new_lon <= grid_bounds['max_lon']):
                
                neighbor = self.create_grid_node(new_lat, new_lon)
                neighbors.append(neighbor)
        
        return neighbors
    
    def a_star_pathfinding_fallback(self, start_coords, end_coords):
        """
        Fallback A* pathfinding algorithm (only used if OSRM fails)
        Returns a list of waypoints from start to end
        """
        try:
            start_lat, start_lon = start_coords
            end_lat, end_lon = end_coords
            
            logger.warning("Using fallback A* pathfinding - results may not follow roads")
            
            # Calculate distance to ensure reasonable pathfinding
            direct_distance = self.haversine_distance(start_lat, start_lon, end_lat, end_lon)
            
            if direct_distance > self.max_route_distance:
                logger.warning(f"Route distance {direct_distance:.2f}km exceeds maximum")
                return self.create_simple_route(start_coords, end_coords)
            
            # For now, return a simple route as the A* implementation is too complex
            # for a fallback scenario
            return self.create_simple_route(start_coords, end_coords)
            
        except Exception as e:
            logger.error(f"Error in A* pathfinding: {e}")
            return self.create_simple_route(start_coords, end_coords)
    
    def nodes_equal(self, node1, node2, tolerance=1e-6):
        """Check if two nodes are equal within tolerance"""
        return (abs(node1['lat'] - node2['lat']) < tolerance and 
                abs(node1['lon'] - node2['lon']) < tolerance)
    
    def create_simple_route(self, start_coords, end_coords):
        """Create a simple direct route with intermediate waypoints (fallback only)"""
        start_lat, start_lon = start_coords
        end_lat, end_lon = end_coords
        
        # Create waypoints along the direct path
        num_waypoints = max(5, int(self.haversine_distance(start_lat, start_lon, end_lat, end_lon) * 3))
        waypoints = []
        
        for i in range(num_waypoints + 1):
            ratio = i / num_waypoints
            lat = start_lat + (end_lat - start_lat) * ratio
            lon = start_lon + (end_lon - start_lon) * ratio
            waypoints.append([lat, lon])
        
        logger.warning(f"Created simple fallback route with {len(waypoints)} waypoints")
        return waypoints
    
    def calculate_route_metrics(self, waypoints):
        """Calculate route metrics from waypoints"""
        if len(waypoints) < 2:
            return {
                'total_distance': 0,
                'estimated_time': '0 minutes',
                'waypoint_count': len(waypoints)
            }
        
        total_distance = 0
        for i in range(len(waypoints) - 1):
            lat1, lon1 = waypoints[i]
            lat2, lon2 = waypoints[i + 1]
            total_distance += self.haversine_distance(lat1, lon1, lat2, lon2)
        
        # Estimate time (assuming average speed of 40 km/h in city)
        average_speed = 40  # km/h
        time_hours = total_distance / average_speed
        time_minutes = int(time_hours * 60)
        
        estimated_time = f"{time_minutes} minutes"
        if time_minutes >= 60:
            hours = time_minutes // 60
            minutes = time_minutes % 60
            estimated_time = f"{hours}h {minutes}m"
        
        return {
            'total_distance': round(total_distance, 2),
            'estimated_time': estimated_time,
            'waypoint_count': len(waypoints)
        }
    
    def get_route_to_station(self, user_location, station_location):
        """
        Calculate route from user location to charging station
        
        Args:
            user_location: [lat, lon] of user
            station_location: [lat, lon] of charging station
        
        Returns:
            Dict with route information including waypoints and metrics
        """
        try:
            logger.info(f"Calculating route from {user_location} to {station_location}")
            
            # Try OSRM API first for real road routing
            osrm_result = self.get_osrm_route(user_location, station_location)
            
            if osrm_result:
                # Use OSRM data
                waypoints = osrm_result['waypoints']
                
                route_data = {
                    'success': True,
                    'waypoints': waypoints,
                    'metrics': {
                        'total_distance': osrm_result['distance_km'],
                        'estimated_time': osrm_result['estimated_time'],
                        'waypoint_count': len(waypoints)
                    },
                    'instructions': osrm_result['instructions'],
                    'algorithm_used': 'osrm_api_real_roads',
                    'data_source': 'OpenStreetMap via OSRM'
                }
                
                logger.info(f"OSRM route calculated successfully: {osrm_result['distance_km']}km, {osrm_result['estimated_time']}")
                return route_data
            
            else:
                # Fallback to simple routing
                logger.warning("OSRM API failed, using fallback routing")
                waypoints = self.a_star_pathfinding_fallback(user_location, station_location)
                
                # Calculate route metrics
                metrics = self.calculate_route_metrics(waypoints)
                
                # Create route instructions (simplified)
                instructions = self.generate_basic_instructions(waypoints)
                
                route_data = {
                    'success': True,
                    'waypoints': waypoints,
                    'metrics': metrics,
                    'instructions': instructions,
                    'algorithm_used': 'fallback_simple_routing',
                    'data_source': 'Direct calculation (not road-based)',
                    'warning': 'Real road routing unavailable - showing approximate direct path'
                }
                
                logger.warning(f"Fallback route calculated: {metrics['total_distance']}km, {metrics['estimated_time']}")
                return route_data
            
        except Exception as e:
            logger.error(f"Error calculating route: {e}")
            return {
                'success': False,
                'error': str(e),
                'waypoints': [],
                'metrics': {},
                'instructions': []
            }