import math
import logging
import heapq

logger = logging.getLogger(__name__)

class HybridAlgorithm:
    """
    Hybrid recommendation algorithm using multiple approaches:
    - Custom Dijkstra's algorithm for pathfinding
    - Min-heap for priority queue management
    - Load balancing scoring system
    - Merge sort for final ranking
    """
    
    def __init__(self):
        # Weights for scoring algorithm
        self.weights = {
            'distance': 0.3,
            'availability': 0.25,
            'load': 0.2,
            'urgency': 0.15,
            'price': 0.1
        }
        
        # Price mapping for different charging stations
        self.price_mapping = {
            'Standard': 15,
            'Fast': 20,
            'Rapid': 25,
            'Ultra-fast': 30
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
    
    def calculate_simple_score(self, station, distance, user_preferences=None):
        """
        Calculate a simple composite score for a station
        
        Args:
            station: Station data dict
            distance: Distance to station in km
            user_preferences: Dict of user preferences (optional)
        
        Returns:
            Float score (0-1, higher is better)
        """
        if user_preferences is None:
            user_preferences = {}
        
        # Distance score (closer is better, max distance considered is 50km)
        max_distance = 50
        distance_score = max(0, 1 - (distance / max_distance))
        
        # Availability score
        availability = station.get('availability', 0)
        total_slots = station.get('total_slots', 1)
        availability_score = availability / total_slots if total_slots > 0 else 0
        
        # Pricing score (lower price is better)
        pricing = station.get('pricing', 20)  # Default to 20 NPR/kWh
        max_price = 35  # Assumed max price
        min_price = 10  # Assumed min price
        price_score = max(0, 1 - ((pricing - min_price) / (max_price - min_price)))
        
        # Rating score
        rating = station.get('rating', 4.0)
        rating_score = rating / 5.0  # Normalize to 0-1
        
        # Features score (bonus for preferred features)
        features = station.get('features', [])
        features_score = 0
        preferred_features = user_preferences.get('preferred_features', [])
        if preferred_features:
            matching_features = len(set(features) & set(preferred_features))
            features_score = matching_features / len(preferred_features) if preferred_features else 0
        
        # Composite score with weights
        composite_score = (
            0.4 * distance_score +      # Distance is most important
            0.25 * availability_score + # Availability is crucial
            0.15 * price_score +        # Price consideration
            0.15 * rating_score +       # Quality rating
            0.05 * features_score       # Feature bonus
        )
        
        return min(1.0, max(0.0, composite_score))
    
    def get_recommendations(self, user_location, stations, user_preferences=None, max_recommendations=5):
        """
        Get station recommendations using simplified API
        
        Args:
            user_location: [lat, lon] of user
            stations: List of station dicts
            user_preferences: Dict of user preferences (optional)
            max_recommendations: Maximum number of recommendations to return
        
        Returns:
            List of recommended stations with scores and distances
        """
        try:
            if not stations:
                return []
            
            if user_preferences is None:
                user_preferences = {}
            
            # Calculate scores for all stations
            scored_stations = []
            
            for station in stations:
                # Calculate distance
                station_location = station.get('location', [0, 0])
                if len(station_location) != 2:
                    logger.warning(f"Invalid station location for station {station.get('id', 'unknown')}")
                    continue
                
                distance = self.haversine_distance(
                    user_location[0], user_location[1],
                    station_location[0], station_location[1]
                )
                
                # Calculate composite score
                score = self.calculate_simple_score(station, distance, user_preferences)
                
                # Create recommendation entry
                recommendation = {
                    'id': station.get('id'),
                    'name': station.get('name', 'Unknown Station'),
                    'location': station_location,
                    'distance': round(distance, 2),
                    'score': round(score, 3),
                    'availability': station.get('availability', 0),
                    'total_slots': station.get('total_slots', 0),
                    'connector_types': station.get('connector_types', []),
                    'pricing': station.get('pricing', 0),
                    'features': station.get('features', []),
                    'rating': station.get('rating', 4.0)
                }
                
                scored_stations.append(recommendation)
            
            # Sort by score (descending)
            scored_stations.sort(key=lambda x: x['score'], reverse=True)
            
            # Return top recommendations
            recommendations = scored_stations[:max_recommendations]
            
            logger.info(f"Generated {len(recommendations)} recommendations from {len(stations)} stations")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []

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
        total_chargers = len(station['chargers'])
        available_chargers = sum(1 for charger in station['chargers'] if charger['available'])
        
        if total_chargers == 0:
            return 0.0
        
        return available_chargers / total_chargers

    def calculate_load_score(self, station):
        """
        Calculate load score (inverted - lower load is better)
        Simulated based on charger power and availability
        """
        total_power = sum(
            float(charger['power'].replace('kW', '')) 
            for charger in station['chargers']
        )
        available_power = sum(
            float(charger['power'].replace('kW', '')) 
            for charger in station['chargers'] 
            if charger['available']
        )
        
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
        power_value = float(power_str.replace('kW', ''))
        
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