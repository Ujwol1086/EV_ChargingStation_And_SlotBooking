import math
import logging
import heapq

logger = logging.getLogger(__name__)

class HybridAlgorithm:
    """
    Enhanced Hybrid recommendation algorithm using multiple approaches:
    - Custom Dijkstra's algorithm for pathfinding
    - Min-heap for priority queue management
    - Context-aware energy consumption calculations
    - Enhanced MCDM scoring with AC, passengers, terrain factors
    - City-name-based destination filtering
    - Route-based station recommendations
    - Merge sort for final ranking
    """
    
    def __init__(self):
        # Enhanced weights for scoring algorithm with new context factors
        # Dynamic weights that adapt based on user context
        self.base_weights = {
            'distance': 0.25,
            'availability': 0.20,
            'energy_efficiency': 0.15,  # New: considers AC, passengers, terrain
            'urgency': 0.15,
            'price': 0.10,
            'plug_compatibility': 0.10,
            'rating': 0.05
        }
        
        # Context-specific weight adjustments
        self.context_weight_adjustments = {
            'emergency': {
                'distance': 0.40,      # Much higher weight for distance in emergency
                'availability': 0.30,   # Higher weight for availability
                'energy_efficiency': 0.20,  # Critical for low battery
                'urgency': 0.10,
                'price': 0.00,         # Ignore price in emergency
                'plug_compatibility': 0.00,  # Ignore plug type in emergency
                'rating': 0.00
            },
            'high': {
                'distance': 0.35,
                'availability': 0.25,
                'energy_efficiency': 0.20,
                'urgency': 0.15,
                'price': 0.05,
                'plug_compatibility': 0.00,
                'rating': 0.00
            },
            'medium': {
                'distance': 0.25,
                'availability': 0.20,
                'energy_efficiency': 0.15,
                'urgency': 0.15,
                'price': 0.10,
                'plug_compatibility': 0.10,
                'rating': 0.05
            },
            'low': {
                'distance': 0.20,
                'availability': 0.15,
                'energy_efficiency': 0.10,
                'urgency': 0.05,
                'price': 0.20,         # Higher weight for price in low urgency
                'plug_compatibility': 0.15,
                'rating': 0.15
            }
        }
        
        # Price mapping for different charging stations
        self.price_mapping = {
            'Standard': 15,
            'Fast': 20,
            'Rapid': 25,
            'Ultra-fast': 30
        }
        
        # Energy consumption factors
        self.energy_factors = {
            'base_consumption_per_km': 0.2,  # kWh per km (base)
            'ac_penalty': 0.15,  # 15% more energy when AC is on
            'passenger_penalty_per_person': 0.03,  # 3% more per additional passenger
            'terrain_multipliers': {
                'flat': 1.0,
                'hilly': 1.2,
                'steep': 1.5
            }
        }
        
        # ETA calculation factors
        self.eta_factors = {
            'base_speed_kmh': 40,  # Base speed in km/h (urban average)
            'driving_modes': {
                'economy': 30,      # 30 km/h - fuel/energy efficient driving
                'sports': 60,       # 60 km/h - performance-oriented driving
                'random': 45        # 45 km/h - mixed driving style
            },
            'traffic_multipliers': {
                'heavy': 0.6,       # 60% of normal speed in heavy traffic
                'medium': 0.8,      # 80% of normal speed in medium traffic
                'light': 1.0        # 100% of normal speed in light traffic
            },
            'terrain_speed_impact': {
                'flat': 1.0,        # No impact on flat terrain
                'hilly': 0.8,       # 20% slower on hilly terrain
                'steep': 0.6        # 40% slower on steep terrain
            },
            'weather_impact': {
                'clear': 1.0,       # No impact in clear weather
                'rain': 0.9,        # 10% slower in rain
                'fog': 0.7,         # 30% slower in fog
                'snow': 0.5         # 50% slower in snow
            },

        }
        
        # City coordinates mapping for destination-based filtering
        self.city_coords = {
            # Major cities in Nepal
            "Kathmandu": (27.7172, 85.3240),
            "Pokhara": (28.2096, 83.9856),
            "Butwal": (27.7000, 83.4500),
            "Biratnagar": (26.4525, 87.2718),
            "Bharatpur": (27.6780, 84.4360),
            "Janakpur": (26.7288, 85.9244),
            "Dharan": (26.8147, 87.2791),
            "Hetauda": (27.4280, 85.0440),
            "Nepalgunj": (28.0500, 81.6167),
            "Birgunj": (27.0170, 84.8800),
            "Dhangadhi": (28.7000, 80.6000),
            "Itahari": (26.6650, 87.2700),
            "Gorkha": (28.0000, 84.6333),
            "Palpa": (27.8667, 83.5500),
            "Lumbini": (27.4833, 83.2833),
            "Chitwan": (27.5291, 84.3542),
            "Dang": (28.0333, 82.3000),
            "Kanchanpur": (28.8333, 80.1667),
            "Mahendranagar": (28.9644, 80.1811),
            "Dadeldhura": (29.3000, 80.5833)
        }
    
    def calculate_energy_consumption(self, distance_km, ac_status=False, passengers=1, terrain='flat', battery_percentage=100):
        """
        Calculate estimated energy consumption based on context factors
        
        Args:
            distance_km: Distance to travel in kilometers
            ac_status: Boolean, True if AC is on
            passengers: Number of passengers (including driver)
            terrain: 'flat', 'hilly', or 'steep'
            battery_percentage: Current battery level
        
        Returns:
            Dict with energy consumption details
        """
        base_consumption = distance_km * self.energy_factors['base_consumption_per_km']
        
        # Apply AC penalty
        if ac_status:
            ac_penalty = base_consumption * self.energy_factors['ac_penalty']
        else:
            ac_penalty = 0
        
        # Apply passenger penalty (additional passengers beyond driver)
        additional_passengers = max(0, passengers - 1)
        passenger_penalty = base_consumption * (additional_passengers * self.energy_factors['passenger_penalty_per_person'])
        
        # Apply terrain multiplier
        terrain_multiplier = self.energy_factors['terrain_multipliers'].get(terrain.lower(), 1.0)
        terrain_penalty = base_consumption * (terrain_multiplier - 1.0)
        
        total_consumption = base_consumption + ac_penalty + passenger_penalty + terrain_penalty
        
        # Calculate if destination is reachable with current battery
        # Assuming average EV has 60kWh battery capacity
        estimated_battery_capacity = 60  # kWh
        available_energy = (battery_percentage / 100) * estimated_battery_capacity
        
        # Keep 20% buffer for safety
        usable_energy = available_energy * 0.8
        
        # Calculate energy efficiency score safely
        if usable_energy > 0:
            energy_efficiency_score = max(0, 1 - (total_consumption / usable_energy))
        else:
            # If no usable energy, efficiency score is 0
            energy_efficiency_score = 0
        
        return {
            'base_consumption_kwh': round(base_consumption, 2),
            'ac_penalty_kwh': round(ac_penalty, 2),
            'passenger_penalty_kwh': round(passenger_penalty, 2),
            'terrain_penalty_kwh': round(terrain_penalty, 2),
            'total_consumption_kwh': round(total_consumption, 2),
            'available_energy_kwh': round(available_energy, 2),
            'usable_energy_kwh': round(usable_energy, 2),
            'is_reachable': total_consumption <= usable_energy,
            'energy_efficiency_score': energy_efficiency_score
        }

    def calculate_eta(self, distance_km, driving_mode='random', traffic_condition='light', 
                     terrain='flat', weather='clear', custom_speed=None):
        """
        Calculate Estimated Time of Arrival (ETA) using hardcoded algorithms
        
        Args:
            distance_km: Distance to travel in kilometers
            driving_mode: 'economy', 'sports', 'random'
            traffic_condition: 'heavy', 'medium', 'light'
            terrain: 'flat', 'hilly', 'steep'
            weather: 'clear', 'rain', 'fog', 'snow'
            custom_speed: Custom speed override in km/h (optional)
        
        Returns:
            Dict with ETA details
        """
        # Use custom speed if provided, otherwise calculate based on factors
        if custom_speed is not None:
            effective_speed = custom_speed
        else:
            # Get base speed from driving mode
            base_speed = self.eta_factors['driving_modes'].get(driving_mode, 45)  # Default to random mode
            
            # Apply traffic condition multiplier
            traffic_multiplier = self.eta_factors['traffic_multipliers'].get(traffic_condition, 1.0)
            
            # Apply terrain impact
            terrain_multiplier = self.eta_factors['terrain_speed_impact'].get(terrain, 1.0)
            
            # Apply weather impact
            weather_multiplier = self.eta_factors['weather_impact'].get(weather, 1.0)
            
            # Calculate effective speed
            effective_speed = base_speed * traffic_multiplier * terrain_multiplier * weather_multiplier
        
        # Ensure minimum speed of 5 km/h and maximum of 120 km/h
        effective_speed = max(5, min(120, effective_speed))
        
        # Calculate travel time in hours
        travel_time_hours = distance_km / effective_speed
        
        # Convert to minutes and seconds
        travel_time_minutes = travel_time_hours * 60
        travel_time_seconds = travel_time_minutes * 60
        
        # Format ETA string
        if travel_time_minutes < 1:
            eta_string = f"{int(travel_time_seconds)} seconds"
        elif travel_time_minutes < 60:
            eta_string = f"{int(travel_time_minutes)} minutes"
        else:
            hours = int(travel_time_minutes // 60)
            minutes = int(travel_time_minutes % 60)
            if minutes == 0:
                eta_string = f"{hours} hour{'s' if hours > 1 else ''}"
            else:
                eta_string = f"{hours}h {minutes}m"
        
        # Calculate arrival time (current time + travel time)
        import datetime
        current_time = datetime.datetime.now()
        arrival_time = current_time + datetime.timedelta(hours=travel_time_hours)
        
        return {
            'distance_km': round(distance_km, 2),
            'effective_speed_kmh': round(effective_speed, 1),
            'travel_time_hours': round(travel_time_hours, 3),
            'travel_time_minutes': round(travel_time_minutes, 1),
            'travel_time_seconds': round(travel_time_seconds, 0),
            'eta_string': eta_string,
            'arrival_time': arrival_time.strftime('%H:%M'),
            'arrival_datetime': arrival_time.isoformat(),
            'factors_applied': {
                'driving_mode': driving_mode,
                'traffic_condition': traffic_condition,
                'terrain': terrain,
                'weather': weather,
                'custom_speed_used': custom_speed is not None
            }
        }

    def calculate_route_eta(self, waypoints, driving_mode='random', traffic_condition='light', 
                           terrain='flat', weather='clear', custom_speed=None):
        """
        Calculate ETA for a route with multiple waypoints
        
        Args:
            waypoints: List of [lat, lon] coordinates
            driving_mode: 'economy', 'sports', 'random'
            traffic_condition: Traffic condition
            terrain: Terrain type
            weather: Weather condition
            custom_speed: Custom speed override
        
        Returns:
            Dict with route ETA details
        """
        if len(waypoints) < 2:
            return None
        
        total_distance = 0
        segment_etas = []
        
        # Calculate distance and ETA for each segment
        for i in range(len(waypoints) - 1):
            start_point = waypoints[i]
            end_point = waypoints[i + 1]
            
            # Calculate distance between points
            segment_distance = self.haversine_distance(
                start_point[0], start_point[1], 
                end_point[0], end_point[1]
            )
            
            total_distance += segment_distance
            
            # Calculate ETA for this segment
            segment_eta = self.calculate_eta(
                segment_distance, driving_mode, traffic_condition, 
                terrain, weather, custom_speed
            )
            
            segment_etas.append({
                'segment': i + 1,
                'start_point': start_point,
                'end_point': end_point,
                'distance_km': segment_distance,
                'eta': segment_eta
            })
        
        # Calculate total ETA
        total_eta = self.calculate_eta(
            total_distance, driving_mode, traffic_condition, 
            terrain, weather, custom_speed
        )
        
        return {
            'total_distance_km': round(total_distance, 2),
            'total_eta': total_eta,
            'segments': segment_etas,
            'waypoints_count': len(waypoints),
            'route_type': 'multi_segment'
        }

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
    
    def calculate_enhanced_score(self, station, distance, user_context=None):
        """
        Calculate enhanced composite score for a station with context-aware factors
        
        Args:
            station: Station data dict
            distance: Distance to station in km
            user_context: Dict with user context (battery, AC, passengers, terrain, etc.)
        
        Returns:
            Dict with detailed scoring breakdown
        """
        if user_context is None:
            user_context = {}
        
        # Extract context parameters
        battery_percentage = user_context.get('battery_percentage', 100)
        ac_status = user_context.get('ac_status', False)
        passengers = user_context.get('passengers', 1)
        terrain = user_context.get('terrain', 'flat')
        plug_type = user_context.get('plug_type', '')
        urgency = user_context.get('urgency', 'medium')
        
        # Ensure battery_percentage is a number and within valid range
        try:
            battery_percentage = float(battery_percentage) if battery_percentage is not None else 100.0
            battery_percentage = max(1, min(100, battery_percentage))  # Clamp between 1% and 100%
        except (ValueError, TypeError):
            battery_percentage = 100.0
            logger.warning(f"Invalid battery_percentage value in calculate_enhanced_score: {user_context.get('battery_percentage')}, using default 100%")
        
        # Ensure passengers is a number
        try:
            passengers = int(passengers) if passengers is not None else 1
            passengers = max(1, min(8, passengers))  # Clamp between 1 and 8
        except (ValueError, TypeError):
            passengers = 1
            logger.warning(f"Invalid passengers value in calculate_enhanced_score: {user_context.get('passengers')}, using default 1")
        
        # 1. Distance score (closer is better, max distance considered is 50km)
        max_distance = 50
        distance_score = max(0, 1 - (distance / max_distance))
        
        # 2. Availability score
        availability = station.get('availability', 0)
        total_slots = station.get('total_slots', 1)
        
        # Ensure both are integers
        try:
            availability = int(availability) if availability is not None else 0
            total_slots = int(total_slots) if total_slots is not None else 1
        except (ValueError, TypeError):
            availability = 0
            total_slots = 1
        
        availability_score = availability / total_slots if total_slots > 0 else 0
        
        # 3. Enhanced Energy Efficiency Score
        energy_analysis = self.calculate_energy_consumption(
            distance, ac_status, passengers, terrain, battery_percentage
        )
        energy_efficiency_score = energy_analysis['energy_efficiency_score']
        
        # Enhanced energy efficiency scoring based on battery level and urgency
        if battery_percentage <= 20:
            # Critical battery - heavily penalize stations that are not reachable
            if not energy_analysis['is_reachable']:
                energy_efficiency_score = 0
            else:
                # Boost score for stations that are easily reachable
                energy_efficiency_score = min(1.0, energy_efficiency_score * 2.0)  # Double boost for critical battery
        elif battery_percentage <= 40:
            # Low battery - moderate penalty for unreachable stations
            if not energy_analysis['is_reachable']:
                energy_efficiency_score = energy_efficiency_score * 0.2  # 80% penalty
            else:
                energy_efficiency_score = min(1.0, energy_efficiency_score * 1.5)  # 50% boost
        elif battery_percentage <= 60:
            # Medium battery - standard scoring with slight boost for reachable
            if not energy_analysis['is_reachable']:
                energy_efficiency_score = energy_efficiency_score * 0.5  # 50% penalty
            else:
                energy_efficiency_score = min(1.0, energy_efficiency_score * 1.2)  # 20% boost
        else:
            # High battery - standard scoring
            if not energy_analysis['is_reachable']:
                energy_efficiency_score = 0
        
        # 4. ETA Calculation
        driving_mode = user_context.get('driving_mode', 'random')
        traffic_condition = user_context.get('traffic_condition', 'light')
        weather = user_context.get('weather', 'clear')
        
        eta_analysis = self.calculate_eta(
            distance, driving_mode, traffic_condition, 
            terrain, weather
        )
        
        # 5. Enhanced Urgency score with dynamic multipliers
        urgency_multipliers = {
            'low': 0.3,
            'medium': 0.6,
            'high': 0.8,
            'emergency': 1.0
        }
        urgency_multiplier = urgency_multipliers.get(urgency.lower(), 0.6)
        urgency_score = urgency_multiplier
        
        # Additional urgency bonuses based on context and battery level
        if urgency.lower() == 'emergency':
            # Emergency gets maximum score
            urgency_score = 1.0
            # Additional bonus for nearby stations in emergency
            if distance <= 5:
                urgency_score = min(1.0, urgency_score + 0.3)  # 30% bonus for very close stations
            elif distance <= 15:
                urgency_score = min(1.0, urgency_score + 0.2)  # 20% bonus for close stations
        elif urgency.lower() == 'high':
            # High urgency gets bonus for nearby stations
            if distance <= 10:
                urgency_score = min(1.0, urgency_score + 0.2)
            elif distance <= 25:
                urgency_score = min(1.0, urgency_score + 0.1)
        elif urgency.lower() == 'low':
            # Low urgency gets bonus for better amenities/rating
            if station.get('rating', 0) >= 4.0:
                urgency_score = min(1.0, urgency_score + 0.1)
        
        # 6. Pricing score (lower price is better)
        pricing = station.get('pricing', 20)  # Default to 20 NPR/kWh
        
        # Ensure pricing is a number
        try:
            pricing = float(pricing) if pricing is not None else 20.0
        except (ValueError, TypeError):
            pricing = 20.0
        
        max_price = 35
        min_price = 10
        price_score = max(0, 1 - ((pricing - min_price) / (max_price - min_price)))
        
        # 7. Plug compatibility score
        station_plugs = station.get('connector_types', [])
        plug_compatibility_score = 1.0 if plug_type in station_plugs or not plug_type else 0.3
        
        # 8. Rating score
        rating = station.get('rating', 4.0)
        
        # Ensure rating is a number
        try:
            rating = float(rating) if rating is not None else 4.0
        except (ValueError, TypeError):
            rating = 4.0
        
        rating_score = rating / 5.0
        
        # 9. ETA score (shorter travel time is better)
        # Convert travel time to a score (0-1, where 1 is best)
        max_expected_time = 120  # 2 hours max expected travel time
        eta_score = max(0, 1 - (eta_analysis['travel_time_minutes'] / max_expected_time))
        
        # Get dynamic weights based on urgency level and battery percentage
        urgency_level = urgency.lower()
        if urgency_level in self.context_weight_adjustments:
            weights = self.context_weight_adjustments[urgency_level].copy()
        else:
            weights = self.base_weights.copy()
        
        # Adjust weights based on battery level for better parameter sensitivity
        # Use safer weight adjustments that don't break the algorithm
        if battery_percentage <= 20:
            # Critical battery - prioritize energy efficiency and distance
            weights['energy_efficiency'] = min(0.35, weights.get('energy_efficiency', 0.15) * 1.5)
            weights['distance'] = min(0.35, weights.get('distance', 0.25) * 1.3)
            weights['price'] = max(0.05, weights.get('price', 0.10) * 0.5)  # Reduce price importance
            weights['rating'] = max(0.02, weights.get('rating', 0.05) * 0.5)  # Reduce rating importance
        elif battery_percentage <= 40:
            # Low battery - moderate adjustments
            weights['energy_efficiency'] = min(0.30, weights.get('energy_efficiency', 0.15) * 1.3)
            weights['distance'] = min(0.30, weights.get('distance', 0.25) * 1.2)
            weights['price'] = max(0.05, weights.get('price', 0.10) * 0.7)
        elif battery_percentage >= 80:
            # High battery - prioritize other factors
            weights['price'] = min(0.15, weights.get('price', 0.10) * 1.3)
            weights['rating'] = min(0.08, weights.get('rating', 0.05) * 1.5)
            weights['energy_efficiency'] = max(0.08, weights.get('energy_efficiency', 0.15) * 0.8)
        
        # Ensure all required weights exist
        required_weights = ['distance', 'availability', 'energy_efficiency', 'urgency', 'price', 'plug_compatibility', 'rating']
        for weight_key in required_weights:
            if weight_key not in weights:
                weights[weight_key] = self.base_weights.get(weight_key, 0.1)
        
        # Normalize weights to ensure they sum to 1.0
        total_weight = sum(weights.values())
        if total_weight > 0:
            weights = {k: v / total_weight for k, v in weights.items()}
        else:
            # Fallback to base weights if normalization fails
            weights = self.base_weights.copy()
            logger.warning(f"Weight normalization failed for battery {battery_percentage}%, using base weights")
        
        # Calculate composite score with dynamic weights
        composite_score = (
            weights['distance'] * distance_score +
            weights['availability'] * availability_score +
            weights['energy_efficiency'] * energy_efficiency_score +
            weights['urgency'] * urgency_score +
            weights['price'] * price_score +
            weights['plug_compatibility'] * plug_compatibility_score +
            weights['rating'] * rating_score +
            eta_score * 0.10  # Add ETA as 10% weight
        )
        
        return {
            'total_score': min(1.0, max(0.0, composite_score)),
            'breakdown': {
                'distance_score': round(distance_score, 3),
                'availability_score': round(availability_score, 3),
                'energy_efficiency_score': round(energy_efficiency_score, 3),
                'urgency_score': round(urgency_score, 3),
                'price_score': round(price_score, 3),
                'plug_compatibility_score': round(plug_compatibility_score, 3),
                'rating_score': round(rating_score, 3),
                'eta_score': round(eta_score, 3)
            },
            'energy_analysis': energy_analysis,
            'eta_analysis': eta_analysis,
            'is_reachable': energy_analysis['is_reachable'],
            'weights_used': weights
        }

    def get_enhanced_recommendations(self, user_location, stations, user_context=None, max_recommendations=5):
        """
        Get enhanced station recommendations with context-aware scoring and destination filtering
        
        Args:
            user_location: [lat, lon] of user
            stations: List of station dicts
            user_context: Dict with context parameters (battery, AC, passengers, terrain, destination_city, etc.)
            max_recommendations: Maximum number of recommendations to return
        
        Returns:
            Dict with recommendations and metadata
        """
        try:
            if not stations:
                logger.warning("No stations provided for recommendations")
                return {
                    'recommendations': [],
                    'algorithm_info': {
                        'algorithm_used': 'Enhanced Hybrid Algorithm',
                        'processing_time_ms': 0,
                        'total_stations_processed': 0
                    }
                }
            
            import time
            start_time = time.time()
            
            if user_context is None:
                user_context = {}
            
            # Check for destination-based filtering
            destination_city = user_context.get('destination_city')
            destination_coords = None
            route_filtering_enabled = False
            
            if destination_city:
                destination_coords = self.get_city_coordinates(destination_city)
                if destination_coords:
                    route_filtering_enabled = True
                    logger.info(f"Destination-based filtering enabled for {destination_city}: {destination_coords}")
                else:
                    logger.warning(f"Unknown destination city: {destination_city}")
            
            # Calculate enhanced scores for all stations
            scored_stations = []
            route_filtered_count = 0
            unreachable_filtered_count = 0
            
            # Extract key parameters for dynamic filtering
            battery_percentage = user_context.get('battery_percentage', 100)
            # Ensure battery_percentage is a number
            try:
                battery_percentage = float(battery_percentage) if battery_percentage is not None else 100.0
            except (ValueError, TypeError):
                battery_percentage = 100.0
                logger.warning(f"Invalid battery_percentage value: {user_context.get('battery_percentage')}, using default 100%")
            
            urgency = user_context.get('urgency', 'medium')
            
            # Determine if we should filter unreachable stations based on context
            # Always filter unreachable for low battery or emergency situations
            should_filter_unreachable = (
                battery_percentage <= 30 or 
                urgency.lower() in ['high', 'emergency'] or
                user_context.get('filter_unreachable', False)
            )
            
            logger.info(f"Battery: {battery_percentage}%, Urgency: {urgency}, Filter unreachable: {should_filter_unreachable}")
            
            for station in stations:
                try:
                    # Extract location - handle both formats
                    station_location = None
                    
                    # Try the ChargingStation model format first (latitude/longitude fields)
                    if 'latitude' in station and 'longitude' in station:
                        station_location = [station['latitude'], station['longitude']]
                    # Fallback to nested location format
                    elif 'location' in station:
                        if isinstance(station['location'], dict) and 'coordinates' in station['location']:
                            station_location = station['location']['coordinates']
                        elif isinstance(station['location'], list) and len(station['location']) == 2:
                            station_location = station['location']
                    
                    if not station_location or len(station_location) != 2:
                        logger.warning(f"Invalid station location for station {station.get('id', 'unknown')}")
                        continue
                    
                    # Route-based filtering if destination is specified
                    route_analysis = None
                    if route_filtering_enabled and destination_coords:
                        # Adjust max detour based on urgency level
                        base_max_detour = user_context.get('max_detour_km', 20)
                        
                        # For high urgency, be more lenient with route filtering
                        urgency_detour_multipliers = {
                            'low': 0.8,      # More strict for low urgency
                            'medium': 1.0,   # Normal filtering
                            'high': 1.5,     # More lenient for high urgency
                            'emergency': 2.0  # Very lenient for emergency
                        }
                        
                        adjusted_max_detour = base_max_detour * urgency_detour_multipliers.get(urgency.lower(), 1.0)
                        
                        route_analysis = self.is_station_along_route(
                            user_location, 
                            destination_coords, 
                            station_location,
                            max_detour_km=adjusted_max_detour,
                            urgency=urgency
                        )
                        
                        # For emergency situations, include all stations within reasonable distance
                        if urgency.lower() == 'emergency':
                            # Include station if it's within 50km of the route
                            emergency_max_distance = 50
                            if route_analysis['distance_to_station'] <= emergency_max_distance:
                                route_analysis['is_along_route'] = True
                        
                        # Skip stations not along the route (unless emergency)
                        if not route_analysis['is_along_route']:
                            route_filtered_count += 1
                            logger.debug(f"Station {station.get('id', 'unknown')} filtered out: detour={route_analysis['detour_distance']:.1f}km, angle_diff={route_analysis['angle_difference']:.1f}°, urgency={urgency}")
                            continue
                        else:
                            logger.debug(f"Station {station.get('id', 'unknown')} included: detour={route_analysis['detour_distance']:.1f}km, angle_diff={route_analysis['angle_difference']:.1f}°, urgency={urgency}")
                    
                    # Calculate distance
                    distance = self.haversine_distance(
                        user_location[0], user_location[1],
                        station_location[0], station_location[1]
                    )
                    
                    # Convert station data to expected format
                    normalized_station = self._normalize_station_data(station)
                    
                    # Calculate enhanced composite score
                    try:
                        score_analysis = self.calculate_enhanced_score(normalized_station, distance, user_context)
                    except Exception as score_error:
                        logger.error(f"Error calculating score for station {station.get('id', 'unknown')}: {score_error}")
                        # Use a basic score calculation as fallback
                        basic_score = max(0, 1 - (distance / 50))  # Simple distance-based score
                        score_analysis = {
                            'total_score': basic_score,
                            'breakdown': {
                                'distance_score': basic_score,
                                'availability_score': 0.5,
                                'energy_efficiency_score': 0.5,
                                'urgency_score': 0.5,
                                'price_score': 0.5,
                                'plug_compatibility_score': 0.5,
                                'rating_score': 0.5,
                                'eta_score': 0.5
                            },
                            'energy_analysis': {
                                'total_consumption_kwh': distance * 0.2,
                                'usable_energy_kwh': (battery_percentage / 100) * 60 * 0.8,
                                'is_reachable': True
                            },
                            'eta_analysis': {
                                'travel_time_minutes': distance * 1.5
                            },
                            'is_reachable': True
                        }
                    
                    # Boost score for stations along route to destination
                    if route_analysis and route_analysis['is_along_route']:
                        # Boost score based on route efficiency
                        route_efficiency_bonus = route_analysis['route_efficiency'] * 0.1  # Up to 10% bonus
                        score_analysis['total_score'] = min(1.0, score_analysis['total_score'] + route_efficiency_bonus)
                        score_analysis['breakdown']['route_efficiency_bonus'] = round(route_efficiency_bonus, 3)
                    
                    # Apply dynamic filtering based on reachability
                    if should_filter_unreachable and not score_analysis['is_reachable']:
                        unreachable_filtered_count += 1
                        logger.debug(f"Station {station.get('id', 'unknown')} filtered out: unreachable (needs {score_analysis['energy_analysis']['total_consumption_kwh']} kWh, has {score_analysis['energy_analysis']['usable_energy_kwh']} kWh)")
                        continue
                    
                    # Create enhanced recommendation entry
                    recommendation = {
                        'id': station.get('id'),
                        'name': station.get('name', 'Unknown Station'),
                        'location': station_location,
                        'address': station.get('address', 'Unknown Address'),
                        'distance': round(distance, 2),
                        'score': score_analysis['total_score'],
                        'score_breakdown': score_analysis['breakdown'],
                        'energy_analysis': score_analysis['energy_analysis'],
                        'eta_analysis': score_analysis['eta_analysis'],
                        'is_reachable': score_analysis['is_reachable'],
                        'availability': normalized_station.get('availability', 0),
                        'total_slots': normalized_station.get('total_slots', 0),
                        'available_slots': normalized_station.get('availability', 0),
                        'connector_types': normalized_station.get('connector_types', []),
                        'pricing': normalized_station.get('pricing', 0),
                        'pricing_per_kwh': normalized_station.get('pricing', 0),
                        'features': normalized_station.get('features', []),
                        'amenities': station.get('features', []),  # Use features from the model
                        'operating_hours': station.get('operating_hours', 'Unknown'),
                        'rating': normalized_station.get('rating', 4.0),
                        'context_factors': {
                            'ac_impact': score_analysis['energy_analysis']['ac_penalty_kwh'],
                            'passenger_impact': score_analysis['energy_analysis']['passenger_penalty_kwh'],
                            'terrain_impact': score_analysis['energy_analysis']['terrain_penalty_kwh'],
                            'total_energy_needed': score_analysis['energy_analysis']['total_consumption_kwh']
                        }
                    }
                    
                    # Add route analysis if available
                    if route_analysis:
                        recommendation['route_analysis'] = {
                            'is_along_route': route_analysis['is_along_route'],
                            'detour_distance': round(route_analysis['detour_distance'], 2),
                            'route_efficiency': round(route_analysis['route_efficiency'], 3),
                            'distance_to_destination': round(route_analysis['distance_station_to_dest'], 2)
                        }
                    
                    scored_stations.append(recommendation)
                    
                except Exception as e:
                    logger.warning(f"Error processing station {station.get('id', 'unknown')}: {e}")
                    continue
            
            # Sort by score (descending)
            scored_stations.sort(key=lambda x: x['score'], reverse=True)
            
            # Apply fallback logic if no reachable stations found
            reachable_stations = [s for s in scored_stations if s['is_reachable']]
            if should_filter_unreachable and not reachable_stations and scored_stations:
                logger.warning("No reachable stations found, providing fallback recommendations with reduced scores")
                # Include unreachable stations but with heavily reduced scores
                for station in scored_stations:
                    if not station['is_reachable']:
                        # Reduce score by 50% for unreachable stations in fallback mode
                        station['score'] = station['score'] * 0.5
                        station['fallback_recommendation'] = True
                        station['fallback_reason'] = f"Station requires {station['energy_analysis']['total_consumption_kwh']} kWh but only {station['energy_analysis']['usable_energy_kwh']} kWh available"
                
                # Re-sort with reduced scores
                scored_stations.sort(key=lambda x: x['score'], reverse=True)
            
            # Ensure we always return at least some recommendations if stations exist
            if not scored_stations and stations:
                logger.warning("No scored stations found, creating basic recommendations")
                # Create basic recommendations as fallback
                for i, station in enumerate(stations[:max_recommendations]):
                    try:
                        station_location = None
                        if 'latitude' in station and 'longitude' in station:
                            station_location = [station['latitude'], station['longitude']]
                        elif 'location' in station:
                            if isinstance(station['location'], dict) and 'coordinates' in station['location']:
                                station_location = station['location']['coordinates']
                            elif isinstance(station['location'], list) and len(station['location']) == 2:
                                station_location = station['location']
                        
                        if station_location:
                            distance = self.haversine_distance(
                                user_location[0], user_location[1],
                                station_location[0], station_location[1]
                            )
                            
                            basic_recommendation = {
                                'id': station.get('id', f'fallback_{i}'),
                                'name': station.get('name', f'Station {i+1}'),
                                'location': station_location,
                                'distance': round(distance, 2),
                                'score': max(0.1, 1 - (distance / 50)),  # Basic distance-based score
                                'is_reachable': True,
                                'energy_analysis': {
                                    'total_consumption_kwh': distance * 0.2,
                                    'usable_energy_kwh': (battery_percentage / 100) * 60 * 0.8
                                },
                                'fallback_recommendation': True,
                                'fallback_reason': 'Basic fallback recommendation due to scoring issues'
                            }
                            scored_stations.append(basic_recommendation)
                    except Exception as e:
                        logger.error(f"Error creating fallback recommendation: {e}")
                        continue
            
            # Return top recommendations
            recommendations = scored_stations[:max_recommendations]
            
            processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            algorithm_used = 'Enhanced Hybrid Algorithm'
            if route_filtering_enabled:
                algorithm_used += f' (Route to {destination_city})'
            
            logger.info(f"Generated {len(recommendations)} enhanced recommendations from {len(stations)} stations")
            logger.info(f"Reachable stations: {len(reachable_stations)}/{len(scored_stations)}")
            if route_filtering_enabled:
                logger.info(f"Route filtering: {route_filtered_count} stations filtered out")
            if should_filter_unreachable:
                logger.info(f"Unreachable filtering: {unreachable_filtered_count} stations filtered out")
            
            return {
                'recommendations': recommendations,
                'algorithm_info': {
                    'algorithm_used': algorithm_used,
                    'processing_time_ms': round(processing_time, 2),
                    'total_stations_processed': len(stations),
                    'stations_filtered': len(stations) - len(scored_stations),
                    'route_filtered': route_filtered_count if route_filtering_enabled else 0,
                    'unreachable_filtered': unreachable_filtered_count if should_filter_unreachable else 0,
                    'reachable_stations': len(reachable_stations),
                    'context_aware': bool(user_context),
                    'filtering_applied': {
                        'filter_unreachable': should_filter_unreachable,
                        'route_filtering': route_filtering_enabled,
                        'battery_percentage': battery_percentage,
                        'urgency_level': urgency
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error in get_enhanced_recommendations: {e}")
            return {
                'recommendations': [],
                'algorithm_info': {
                    'algorithm_used': 'Enhanced Hybrid Algorithm (Error)',
                    'processing_time_ms': 0,
                    'total_stations_processed': 0,
                    'error': str(e)
                }
            }

    def _normalize_station_data(self, station):
        """
        Normalize station data from ChargingStation model format to expected algorithm format
        
        Args:
            station: Station data from ChargingStation model
            
        Returns:
            Normalized station data dict
        """
        # Handle both ChargingStation model format and raw JSON format
        if 'chargers' in station:
            # Raw JSON format
            chargers = station.get('chargers', [])
            
            # Calculate availability
            available_chargers = [c for c in chargers if c.get('available', False)]
            total_slots = len(chargers)
            availability = len(available_chargers)
            
            # Extract connector types
            connector_types = list(set([c.get('type', '') for c in chargers if c.get('type')]))
            
            # Extract pricing (convert from string if needed)
            pricing_str = station.get('pricing', '20')
            pricing = 20  # Default
            try:
                # Extract number from strings like "NPR 15 per kWh"
                import re
                match = re.search(r'(\d+)', pricing_str)
                if match:
                    pricing = int(match.group(1))
            except:
                pricing = 20
            
            # Extract features/amenities
            features = station.get('amenities', [])
            
        else:
            # ChargingStation model format
            total_slots = station.get('total_slots', 0)
            availability = station.get('available_slots', 0)
            connector_types = station.get('connector_types', [])
            pricing = station.get('pricing_per_kwh', 20)
            features = station.get('features', [])
            chargers = []  # Not available in this format
        
        return {
            'id': station.get('id'),
            'name': station.get('name', 'Unknown Station'),
            'location': [station.get('latitude', 0), station.get('longitude', 0)],
            'availability': availability,
            'total_slots': total_slots,
            'connector_types': connector_types,
            'pricing': pricing,
            'features': features,
            'rating': station.get('rating', 4.0),
            'chargers': chargers
        }

    # Legacy method - kept for backward compatibility
    def get_recommendations_legacy(self, user_input):
        """
        Original method to get hybrid recommendations using hardcoded algorithms
        
        Args:
            user_input: Dict containing:
                - location: [lat, lng]
                - battery_percentage: int
                - plug_type: str
                - urgency: str ('low', 'medium', 'high', 'emergency')
                - stations: List of all available stations
        
        Returns:
            Dict with recommendations and metadata
        """
        try:
            user_location = user_input['location']
            plug_type = user_input['plug_type']
            urgency = user_input['urgency']
            all_stations = user_input['stations']
            
            # Step 1: Filter by plug compatibility
            compatible_stations = self.filter_by_plug_compatibility(all_stations, plug_type)
            
            if not compatible_stations:
                return {
                    'success': False,
                    'error': f'No stations found with {plug_type} plugs',
                    'recommendations': []
                }
            
            # Step 2: Calculate distances using Haversine formula
            # Step 3: Use custom Dijkstra's algorithm for pathfinding
            distances = self.dijkstra_shortest_path(compatible_stations, user_location)
            
            # Step 4: Apply scoring and load balancing using custom heap
            recommendations = self.load_balancing_recommendation(
                compatible_stations, user_location, plug_type, urgency
            )
            
            # Alternative approach: Use merge sort for final ranking
            stations_with_scores = []
            for station in compatible_stations:
                distance = self.haversine_distance(
                    user_location[0], user_location[1],
                    station['location']['coordinates'][0],
                    station['location']['coordinates'][1]
                )
                score = self.calculate_composite_score(station, distance, urgency)
                stations_with_scores.append({
                    'station': station,
                    'score': score,
                    'distance': distance
                })
            
            # Sort using custom merge sort
            sorted_stations = self.merge_sort_stations(stations_with_scores)
            
            # Log algorithm verification
            logger.info(f"Hybrid algorithm processed {len(compatible_stations)} compatible stations")
            logger.info(f"Top 3 recommendations selected using custom heap and scoring")
            
            return {
                'success': True,
                'recommendations': recommendations,
                'total_compatible_stations': len(compatible_stations),
                'algorithm_used': 'hybrid_custom_dijkstra_heap_mergesort',
                'weights_used': self.weights,
                'sorted_backup': sorted_stations[:3]  # Alternative ranking for verification
            }
            
        except Exception as e:
            logger.error(f"Error in get_recommendations_legacy: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'recommendations': []
            }

    # Keep all the existing methods for backward compatibility
    def dijkstra_shortest_path(self, stations, user_location):
        """
        Custom implementation of Dijkstra's algorithm for pathfinding
        """
        # Create a graph representation
        nodes = {}
        
        # Add user location as starting node
        start_node = f"user_{user_location[0]}_{user_location[1]}"
        nodes[start_node] = {
            'lat': user_location[0],
            'lon': user_location[1],
            'distance': 0,
            'visited': False,
            'previous': None
        }
        
        # Add all stations as nodes
        for station in stations:
            station_coords = station['location']['coordinates']
            node_id = f"station_{station['id']}"
            nodes[node_id] = {
                'lat': station_coords[0],
                'lon': station_coords[1],
                'distance': float('inf'),
                'visited': False,
                'previous': None,
                'station_data': station
            }
        
        # Priority queue for unvisited nodes
        unvisited = [(0, start_node)]
        
        while unvisited:
            current_distance, current_node = heapq.heappop(unvisited)
            
            if nodes[current_node]['visited']:
                continue
                
            nodes[current_node]['visited'] = True
            
            # Update distances to neighboring nodes
            for neighbor_id, neighbor in nodes.items():
                if neighbor['visited']:
                    continue
                    
                # Calculate distance between current node and neighbor
                distance = self.haversine_distance(
                    nodes[current_node]['lat'], nodes[current_node]['lon'],
                    neighbor['lat'], neighbor['lon']
                )
                
                new_distance = current_distance + distance
                
                if new_distance < neighbor['distance']:
                    neighbor['distance'] = new_distance
                    neighbor['previous'] = current_node
                    heapq.heappush(unvisited, (new_distance, neighbor_id))
        
        # Extract distances to stations
        station_distances = {}
        for node_id, node in nodes.items():
            if 'station_data' in node:
                station_distances[node['station_data']['id']] = node['distance']
        
        logger.info(f"Dijkstra's algorithm calculated distances to {len(station_distances)} stations")
        return station_distances

    def min_heap_insert(self, heap, item):
        """Insert item into min heap"""
        heapq.heappush(heap, item)

    def min_heap_extract(self, heap):
        """Extract minimum item from heap"""
        if heap:
            return heapq.heappop(heap)
        return None

    def _bubble_up(self, heap, index):
        """Restore heap property by bubbling up"""
        if index == 0:
            return
            
        parent_index = (index - 1) // 2
        
        # Compare by score (first element of tuple)
        if heap[index][0] < heap[parent_index][0]:
            heap[index], heap[parent_index] = heap[parent_index], heap[index]
            self._bubble_up(heap, parent_index)
    
    def _bubble_down(self, heap, index):
        """Restore heap property by bubbling down"""
        left_child = 2 * index + 1
        right_child = 2 * index + 2
        smallest = index
        
        # Find smallest among node and its children
        if (left_child < len(heap) and 
            heap[left_child][0] < heap[smallest][0]):
            smallest = left_child
            
        if (right_child < len(heap) and 
            heap[right_child][0] < heap[smallest][0]):
            smallest = right_child
        
        # If smallest is not current node, swap and continue
        if smallest != index:
            heap[index], heap[smallest] = heap[smallest], heap[index]
            self._bubble_down(heap, smallest)

    def calculate_availability_score(self, station):
        """Calculate availability score based on available chargers"""
        chargers = station.get('chargers', [])
        total_chargers = len(chargers)
        available_chargers = sum(1 for charger in chargers if charger.get('available', False))
        
        if total_chargers == 0:
            return 0.0
        
        return available_chargers / total_chargers

    def calculate_load_score(self, station):
        """
        Calculate load score (inverted - lower load is better)
        Simulated based on charger power and availability
        """
        total_power = 0
        available_power = 0
        
        for charger in station.get('chargers', []):
            power_str = charger.get('power', '')
            if power_str and power_str.strip():  # Check if power is not empty
                try:
                    power_value = float(power_str.replace('kW', ''))
                    total_power += power_value
                    if charger.get('available', False):
                        available_power += power_value
                except (ValueError, TypeError):
                    # Skip invalid power values
                    continue
        
        if total_power == 0:
            return 0.0
            
        # Load factor (0 = no load, 1 = full load)
        load_factor = 1 - (available_power / total_power)
        
        # Return inverted score (lower load = higher score)
        return 1 - load_factor

    def calculate_urgency_score(self, urgency, station):
        """Calculate urgency-based score modifier"""
        urgency_weights = {
            'low': 0.1,
            'medium': 0.5,
            'high': 0.8,
            'emergency': 1.0
        }
        
        base_score = urgency_weights.get(urgency.lower(), 0.5)
        # Higher availability boosts urgency score
        availability_bonus = self.calculate_availability_score(station) * 0.2
        
        return min(base_score + availability_bonus, 1.0)

    def calculate_price_score(self, station):
        """Calculate price score (lower price = higher score)"""
        if not station.get('pricing_info'):
            return 0.5  # Default score if no pricing info
        
        price_str = station['pricing_info']
        price_value = self.price_mapping.get(price_str, 18)  # Default to 18 NPR
        
        # Normalize price (lower price = higher score)
        max_price = max(self.price_mapping.values())
        min_price = min(self.price_mapping.values())
        
        normalized_score = 1 - ((price_value - min_price) / (max_price - min_price))
        return normalized_score

    def calculate_composite_score(self, station, distance, urgency):
        """Calculate composite score using weighted factors"""
        # Distance score (closer = better, normalized to 0-1)
        max_distance = 50  # Maximum reasonable distance in km
        distance_score = max(0, 1 - (distance / max_distance))
        
        # Individual component scores
        availability_score = self.calculate_availability_score(station)
        load_score = self.calculate_load_score(station)
        urgency_score = self.calculate_urgency_score(urgency, station)
        price_score = self.calculate_price_score(station)
        
        # Weighted composite score
        composite_score = (
            self.weights['distance'] * distance_score +
            self.weights['availability'] * availability_score +
            self.weights['load'] * load_score +
            self.weights['urgency'] * urgency_score +
            self.weights['price'] * price_score
        )
        
        return composite_score

    def filter_by_plug_compatibility(self, stations, required_plug_type):
        """Filter stations that have the required plug type"""
        compatible_stations = []
        
        for station in stations:
            # Check if any charger at this station has the required plug type
            has_compatible_plug = any(
                charger.get('plug_type') == required_plug_type 
                for charger in station.get('chargers', [])
            )
            
            if has_compatible_plug:
                compatible_stations.append(station)
        
        return compatible_stations

    def auto_book_slot(self, station, urgency, plug_type):
        """
        Auto-book a charging slot for high urgency situations
        Returns booking information if successful
        """
        # Only auto-book for high urgency or emergency situations
        if urgency.lower() not in ['high', 'emergency']:
            return {'auto_booked': False}
        
        # Find an available charger with the required plug type
        available_chargers = [
            charger for charger in station.get('chargers', [])
            if charger.get('available', False) and charger.get('plug_type') == plug_type
        ]
        
        if not available_chargers:
            return {'auto_booked': False}
        
        # Select the first available charger (could be optimized further)
        selected_charger = available_chargers[0]
        
        # Generate booking information
        import uuid
        booking_id = f"AUTO_{uuid.uuid4().hex[:8].upper()}"
        
        # Calculate estimated charging time (simplified)
        estimated_time = self.calculate_estimated_charging_time(selected_charger)
        
        return {
            'auto_booked': True,
            'booking_id': booking_id,
            'charger_type': selected_charger.get('plug_type'),
            'power': selected_charger.get('power'),
            'estimated_time': estimated_time
        }

    def calculate_estimated_charging_time(self, charger):
        """Estimate charging time based on charger power"""
        power_str = charger.get('power', '22kW')
        
        # Handle empty or invalid power values
        if not power_str or not power_str.strip():
            power_str = '22kW'  # Default fallback
        
        try:
            power_value = float(power_str.replace('kW', ''))
        except (ValueError, TypeError):
            power_value = 22.0  # Default fallback
        
        # Simplified estimation (assumes charging from 20% to 80%)
        # Average EV battery capacity: 60kWh, charging 60% = 36kWh
        battery_to_charge = 36  # kWh
        charging_efficiency = 0.9  # 90% efficiency
        
        time_hours = (battery_to_charge / charging_efficiency) / power_value
        time_minutes = int(time_hours * 60)
        
        if time_minutes < 60:
            return f"{time_minutes} minutes"
        else:
            hours = time_minutes // 60
            minutes = time_minutes % 60
            return f"{hours}h {minutes}m"

    def load_balancing_recommendation(self, stations, user_location, plug_type, urgency):
        """
        Advanced recommendation using load balancing and custom heap
        """
        recommendations = []
        heap = []  # Min heap for managing recommendations
        
        for station in stations:
            # Calculate distance
            distance = self.haversine_distance(
                user_location[0], user_location[1],
                station['location']['coordinates'][0],
                station['location']['coordinates'][1]
            )
            
            # Calculate composite score
            score = self.calculate_composite_score(station, distance, urgency)
            
            # Auto-booking logic
            auto_booking = self.auto_book_slot(station, urgency, plug_type)
            
            # Create recommendation object
            recommendation = {
                'station': station,
                'distance': round(distance, 2),
                'score': round(score, 3),
                'auto_booking': auto_booking
            }
            
            # Use min heap (negate score for max heap behavior)
            self.min_heap_insert(heap, (-score, recommendation))
        
        # Extract top 3 recommendations from heap
        for _ in range(min(3, len(heap))):
            if heap:
                neg_score, recommendation = self.min_heap_extract(heap)
                recommendations.append(recommendation)
        
        logger.info(f"Load balancing algorithm selected {len(recommendations)} recommendations")
        return recommendations

    def merge_sort_stations(self, stations_with_scores):
        """Custom merge sort implementation for stations"""
        if len(stations_with_scores) <= 1:
            return stations_with_scores
        
        mid = len(stations_with_scores) // 2
        left = self.merge_sort_stations(stations_with_scores[:mid])
        right = self.merge_sort_stations(stations_with_scores[mid:])
        
        return self.merge_sorted_arrays(left, right)

    def merge_sorted_arrays(self, left, right):
        """Merge two sorted arrays by score (descending)"""
        result = []
        i = j = 0
        
        while i < len(left) and j < len(right):
            # Sort by score in descending order
            if left[i]['score'] >= right[j]['score']:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        
        # Add remaining elements
        result.extend(left[i:])
        result.extend(right[j:])
        
        return result 

    def get_recommendations(self, user_location, stations, user_preferences=None, max_recommendations=5):
        """
        Get station recommendations using simplified API (backward compatibility)
        
        Args:
            user_location: [lat, lon] of user
            stations: List of station dicts
            user_preferences: Dict of user preferences (optional)
            max_recommendations: Maximum number of recommendations to return
        
        Returns:
            List of recommended stations with scores and distances
        """
        # Convert old preferences format to new context format
        user_context = {}
        if user_preferences:
            user_context.update(user_preferences)
        
        # Use enhanced recommendations but return simplified format for compatibility
        enhanced_result = self.get_enhanced_recommendations(
            user_location, stations, user_context, max_recommendations
        )
        
        # Extract recommendations from enhanced result
        if isinstance(enhanced_result, dict) and 'recommendations' in enhanced_result:
            enhanced_recommendations = enhanced_result['recommendations']
        else:
            enhanced_recommendations = enhanced_result
        
        # Convert to simple format for backward compatibility
        simple_recommendations = []
        for rec in enhanced_recommendations:
            simple_rec = {
                'id': rec.get('id'),
                'name': rec.get('name'),
                'location': rec.get('location'),
                'distance': rec.get('distance'),
                'score': round(rec.get('score', 0), 3),
                'availability': rec.get('availability'),
                'total_slots': rec.get('total_slots'),
                'connector_types': rec.get('connector_types'),
                'pricing': rec.get('pricing'),
                'features': rec.get('features'),
                'rating': rec.get('rating')
            }
            simple_recommendations.append(simple_rec)
        
        return simple_recommendations 

    def get_city_coordinates(self, city_name):
        """
        Get coordinates for a city name
        
        Args:
            city_name: Name of the city
            
        Returns:
            Tuple of (lat, lon) or None if city not found
        """
        # Normalize city name (case-insensitive, strip whitespace)
        normalized_name = city_name.strip().title()
        
        # Direct lookup
        if normalized_name in self.city_coords:
            return self.city_coords[normalized_name]
        
        # Fuzzy matching for common variations
        for city, coords in self.city_coords.items():
            if normalized_name.lower() in city.lower() or city.lower() in normalized_name.lower():
                return coords
        
        return None
    
    def is_station_along_route(self, user_location, destination_coords, station_location, max_detour_km=20, urgency='medium'):
        """
        Determine if a charging station is along the route from user to destination
        
        Args:
            user_location: [lat, lon] of user
            destination_coords: [lat, lon] of destination
            station_location: [lat, lon] of station
            max_detour_km: Maximum detour distance to consider station "along route"
            
        Returns:
            Dict with route analysis
        """
        # Calculate direct distance from user to destination
        direct_distance = self.haversine_distance(
            user_location[0], user_location[1],
            destination_coords[0], destination_coords[1]
        )
        
        # Calculate distance via station (user -> station -> destination)
        distance_to_station = self.haversine_distance(
            user_location[0], user_location[1],
            station_location[0], station_location[1]
        )
        
        distance_station_to_dest = self.haversine_distance(
            station_location[0], station_location[1],
            destination_coords[0], destination_coords[1]
        )
        
        via_station_distance = distance_to_station + distance_station_to_dest
        detour_distance = via_station_distance - direct_distance
        
        # Check if station is along the route (within acceptable detour)
        is_along_route = detour_distance <= max_detour_km
        
        # Additional check: station should be in the general direction of destination
        # Calculate bearing from user to destination and user to station
        bearing_to_dest = self.calculate_bearing(user_location, destination_coords)
        bearing_to_station = self.calculate_bearing(user_location, station_location)
        
        # Calculate angle difference (normalized to 0-180 degrees)
        angle_diff = abs(bearing_to_dest - bearing_to_station)
        if angle_diff > 180:
            angle_diff = 360 - angle_diff
        
        # Station should be in roughly the same direction (within 90 degrees)
        # For high urgency, be more lenient with direction
        base_angle_limit = 90
        urgency_angle_multipliers = {
            'low': 0.8,      # More strict for low urgency (72 degrees)
            'medium': 1.0,   # Normal filtering (90 degrees)
            'high': 1.2,     # More lenient for high urgency (108 degrees)
            'emergency': 1.5  # Very lenient for emergency (135 degrees)
        }
        
        # Use the urgency parameter passed to the method
        angle_limit = base_angle_limit * urgency_angle_multipliers.get(urgency.lower(), 1.0)
        
        is_right_direction = angle_diff <= angle_limit
        
        return {
            'is_along_route': is_along_route and is_right_direction,
            'detour_distance': detour_distance,
            'direct_distance': direct_distance,
            'via_station_distance': via_station_distance,
            'angle_difference': angle_diff,
            'distance_to_station': distance_to_station,
            'distance_station_to_dest': distance_station_to_dest,
            'route_efficiency': direct_distance / via_station_distance if via_station_distance > 0 else 0
        }
    
    def calculate_bearing(self, start_coords, end_coords):
        """
        Calculate the bearing between two coordinates
        
        Args:
            start_coords: [lat, lon] of start point
            end_coords: [lat, lon] of end point
            
        Returns:
            Bearing in degrees (0-360)
        """
        lat1, lon1 = math.radians(start_coords[0]), math.radians(start_coords[1])
        lat2, lon2 = math.radians(end_coords[0]), math.radians(end_coords[1])
        
        dlon = lon2 - lon1
        
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        
        bearing = math.atan2(y, x)
        bearing = math.degrees(bearing)
        bearing = (bearing + 360) % 360
        
        return bearing 