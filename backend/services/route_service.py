import math
import logging

logger = logging.getLogger(__name__)

class RouteService:
    """Service for calculating routes using hardcoded algorithms"""
    
    def __init__(self):
        # Grid-based pathfinding parameters
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
    
    def create_grid_node(self, lat, lon):
        """Create a grid node for pathfinding"""
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
        """Get neighboring grid points for A* algorithm"""
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
    
    def a_star_pathfinding(self, start_coords, end_coords):
        """
        Hardcoded A* pathfinding algorithm
        Returns a list of waypoints from start to end
        """
        try:
            start_lat, start_lon = start_coords
            end_lat, end_lon = end_coords
            
            # Calculate distance to ensure reasonable pathfinding
            direct_distance = self.haversine_distance(start_lat, start_lon, end_lat, end_lon)
            
            if direct_distance > self.max_route_distance:
                logger.warning(f"Route distance {direct_distance:.2f}km exceeds maximum")
                return self.create_simple_route(start_coords, end_coords)
            
            # Create grid bounds
            grid_bounds = {
                'min_lat': min(start_lat, end_lat) - 0.01,
                'max_lat': max(start_lat, end_lat) + 0.01,
                'min_lon': min(start_lon, end_lon) - 0.01,
                'max_lon': max(start_lon, end_lon) + 0.01
            }
            
            # Initialize start and end nodes
            start_node = self.create_grid_node(start_lat, start_lon)
            end_node = self.create_grid_node(end_lat, end_lon)
            
            start_node['g_cost'] = 0
            start_node['h_cost'] = self.haversine_distance(start_lat, start_lon, end_lat, end_lon)
            start_node['f_cost'] = start_node['h_cost']
            
            # A* algorithm
            open_list = [start_node]
            closed_list = []
            
            max_iterations = 1000  # Prevent infinite loops
            iterations = 0
            
            while open_list and iterations < max_iterations:
                iterations += 1
                
                # Find node with lowest f_cost
                current_node = min(open_list, key=lambda x: x['f_cost'])
                open_list.remove(current_node)
                closed_list.append(current_node)
                
                # Check if we reached the goal
                goal_distance = self.haversine_distance(
                    current_node['lat'], current_node['lon'], end_lat, end_lon
                )
                
                if goal_distance < self.grid_resolution * 2:  # Close enough to goal
                    # Reconstruct path
                    path = []
                    node = current_node
                    
                    while node:
                        path.append([node['lat'], node['lon']])
                        node = node['parent']
                    
                    path.reverse()
                    path.append([end_lat, end_lon])  # Ensure we end at exact destination
                    
                    logger.info(f"A* pathfinding completed in {iterations} iterations, path length: {len(path)}")
                    return path
                
                # Process neighbors
                neighbors = self.get_neighbors(current_node, grid_bounds)
                
                for neighbor in neighbors:
                    # Skip if already in closed list
                    if any(self.nodes_equal(neighbor, closed_node) for closed_node in closed_list):
                        continue
                    
                    # Calculate costs
                    movement_cost = self.haversine_distance(
                        current_node['lat'], current_node['lon'],
                        neighbor['lat'], neighbor['lon']
                    )
                    
                    tentative_g_cost = current_node['g_cost'] + movement_cost
                    
                    # Check if this path to neighbor is better
                    existing_neighbor = next(
                        (node for node in open_list if self.nodes_equal(node, neighbor)), 
                        None
                    )
                    
                    if existing_neighbor is None:
                        # New node
                        neighbor['g_cost'] = tentative_g_cost
                        neighbor['h_cost'] = self.haversine_distance(
                            neighbor['lat'], neighbor['lon'], end_lat, end_lon
                        )
                        neighbor['f_cost'] = neighbor['g_cost'] + neighbor['h_cost']
                        neighbor['parent'] = current_node
                        open_list.append(neighbor)
                    elif tentative_g_cost < existing_neighbor['g_cost']:
                        # Better path found
                        existing_neighbor['g_cost'] = tentative_g_cost
                        existing_neighbor['f_cost'] = tentative_g_cost + existing_neighbor['h_cost']
                        existing_neighbor['parent'] = current_node
            
            # If A* fails, fall back to simple route
            logger.warning("A* pathfinding failed, using simple route")
            return self.create_simple_route(start_coords, end_coords)
            
        except Exception as e:
            logger.error(f"Error in A* pathfinding: {e}")
            return self.create_simple_route(start_coords, end_coords)
    
    def nodes_equal(self, node1, node2, tolerance=1e-6):
        """Check if two nodes are equal within tolerance"""
        return (abs(node1['lat'] - node2['lat']) < tolerance and 
                abs(node1['lon'] - node2['lon']) < tolerance)
    
    def create_simple_route(self, start_coords, end_coords):
        """Create a simple direct route with intermediate waypoints"""
        start_lat, start_lon = start_coords
        end_lat, end_lon = end_coords
        
        # Create waypoints along the direct path
        num_waypoints = max(3, int(self.haversine_distance(start_lat, start_lon, end_lat, end_lon) * 2))
        waypoints = []
        
        for i in range(num_waypoints + 1):
            ratio = i / num_waypoints
            lat = start_lat + (end_lat - start_lat) * ratio
            lon = start_lon + (end_lon - start_lon) * ratio
            waypoints.append([lat, lon])
        
        logger.info(f"Created simple route with {len(waypoints)} waypoints")
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
            
            # Calculate route using A* pathfinding
            waypoints = self.a_star_pathfinding(user_location, station_location)
            
            # Calculate route metrics
            metrics = self.calculate_route_metrics(waypoints)
            
            # Create route instructions (simplified)
            instructions = self.generate_route_instructions(waypoints)
            
            route_data = {
                'success': True,
                'waypoints': waypoints,
                'metrics': metrics,
                'instructions': instructions,
                'algorithm_used': 'a_star_pathfinding'
            }
            
            logger.info(f"Route calculated successfully: {metrics['total_distance']}km, {metrics['estimated_time']}")
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
    
    def generate_route_instructions(self, waypoints):
        """Generate basic route instructions from waypoints"""
        if len(waypoints) < 2:
            return ["No route available"]
        
        instructions = []
        instructions.append("Start from your current location")
        
        # Calculate total segments
        total_segments = len(waypoints) - 1
        
        if total_segments <= 3:
            instructions.append("Head directly towards the charging station")
        else:
            # Add intermediate instructions
            quarter_point = total_segments // 4
            half_point = total_segments // 2
            three_quarter_point = 3 * total_segments // 4
            
            if quarter_point > 0:
                instructions.append(f"Continue for {quarter_point} segments")
            if half_point > quarter_point:
                instructions.append("Continue straight at the midpoint")
            if three_quarter_point > half_point:
                instructions.append("You're almost there, continue forward")
        
        instructions.append("Arrive at the charging station")
        
        return instructions 