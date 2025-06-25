import math
import logging

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self):
        # Weights for scoring algorithm
        self.weights = {
            'distance': 0.3,
            'availability': 0.25,
            'load': 0.2,
            'urgency': 0.15,
            'price': 0.1
        }
        
        # Price per kWh mapping (NPR)
        self.price_mapping = {
            'NPR 12 per kWh': 12,
            'NPR 15 per kWh': 15,
            'NPR 16 per kWh': 16,
            'NPR 18 per kWh': 18,
            'NPR 20 per kWh': 20,
            'NPR 22 per kWh': 22
        }

    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees)
        Returns distance in kilometers
        """
        # Convert decimal degrees to radians 
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        # Haversine formula 
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        return c * r

    def dijkstra_shortest_path(self, stations, user_location):
        """
        Hardcoded Dijkstra's algorithm implementation to find shortest paths.
        Since we don't have a road network graph, we'll use haversine distance as approximation.
        Returns a dictionary of distances from user location to each station.
        """
        # Initialize distances
        distances = {}
        visited = []
        unvisited = []
        
        # Create nodes: user location + all stations
        user_node = {'id': 'user', 'coords': user_location, 'distance': 0}
        nodes = [user_node]
        
        # Add station nodes
        for station in stations:
            station_coords = station['location']['coordinates']
            distance_from_user = self.haversine_distance(
                user_location[0], user_location[1],
                station_coords[0], station_coords[1]
            )
            
            station_node = {
                'id': station['id'],
                'coords': station_coords,
                'distance': float('inf')
            }
            nodes.append(station_node)
            distances[station['id']] = distance_from_user
            unvisited.append(station_node)
        
        # Set initial distance for user node
        user_node['distance'] = 0
        unvisited.append(user_node)
        
        # Dijkstra's algorithm implementation
        while unvisited:
            # Find node with minimum distance
            current_node = min(unvisited, key=lambda x: x['distance'])
            unvisited.remove(current_node)
            visited.append(current_node)
            
            # Update distances to neighboring nodes
            for neighbor in unvisited:
                # Calculate distance between current node and neighbor
                edge_distance = self.haversine_distance(
                    current_node['coords'][0], current_node['coords'][1],
                    neighbor['coords'][0], neighbor['coords'][1]
                )
                
                # Calculate new distance through current node
                new_distance = current_node['distance'] + edge_distance
                
                # Update if we found a shorter path
                if new_distance < neighbor['distance']:
                    neighbor['distance'] = new_distance
                    
                    # Update distances dictionary for stations
                    if neighbor['id'] != 'user':
                        distances[neighbor['id']] = new_distance
        
        return distances

    def min_heap_insert(self, heap, item):
        """Insert item into min heap maintaining heap property"""
        heap.append(item)
        self._bubble_up(heap, len(heap) - 1)
    
    def min_heap_extract(self, heap):
        """Extract minimum item from heap"""
        if not heap:
            return None
            
        if len(heap) == 1:
            return heap.pop()
        
        # Store the minimum item
        min_item = heap[0]
        
        # Move last item to root and remove last
        heap[0] = heap.pop()
        
        # Restore heap property
        self._bubble_down(heap, 0)
        
        return min_item
    
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
        """Calculate urgency-based score"""
        urgency_multipliers = {
            'low': 0.5,
            'medium': 1.0,
            'high': 1.5,
            'emergency': 2.0
        }
        
        base_score = self.calculate_availability_score(station)
        multiplier = urgency_multipliers.get(urgency.lower(), 1.0)
        
        return min(base_score * multiplier, 1.0)

    def calculate_price_score(self, station):
        """Calculate price score (inverted - lower price is better)"""
        price_str = station.get('pricing', 'NPR 15 per kWh')
        price = self.price_mapping.get(price_str, 15)
        
        # Normalize price score (assuming max price is 25 NPR)
        max_price = 25
        min_price = 10
        
        # Invert the score so lower price gives higher score
        return (max_price - price) / (max_price - min_price)

    def calculate_composite_score(self, station, distance, urgency):
        """Calculate composite score for a station"""
        # Normalize distance (assuming max relevant distance is 50km)
        max_distance = 50
        distance_score = max(0, (max_distance - distance) / max_distance)
        
        availability_score = self.calculate_availability_score(station)
        load_score = self.calculate_load_score(station)
        urgency_score = self.calculate_urgency_score(urgency, station)
        price_score = self.calculate_price_score(station)
        
        # Calculate weighted score
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
            has_compatible_plug = any(
                charger['type'].lower() == required_plug_type.lower()
                for charger in station['chargers']
            )
            
            if has_compatible_plug:
                compatible_stations.append(station)
        
        return compatible_stations

    def auto_book_slot(self, station, urgency, plug_type):
        """Auto-book slot if conditions are met"""
        if urgency.lower() in ['high', 'emergency']:
            # Find available charger of the required type
            available_charger = None
            for charger in station['chargers']:
                if (charger['type'].lower() == plug_type.lower() and 
                    charger['available']):
                    available_charger = charger
                    break
            
            if available_charger:
                # Simulate booking (in real implementation, this would update the database)
                booking_id = f"AUTO_{station['id']}_{abs(hash(str(station)))}"
                return {
                    'auto_booked': True,
                    'booking_id': booking_id,
                    'charger_type': available_charger['type'],
                    'power': available_charger['power'],
                    'estimated_time': self.calculate_estimated_charging_time(available_charger)
                }
        
        return {'auto_booked': False}

    def calculate_estimated_charging_time(self, charger):
        """Calculate estimated charging time based on charger power"""
        power = float(charger['power'].replace('kW', ''))
        
        # Rough estimation for 80% charge (assuming 50kWh battery average)
        battery_capacity = 50  # kWh
        charge_needed = battery_capacity * 0.8  # 80% charge
        
        time_hours = charge_needed / power
        time_minutes = int(time_hours * 60)
        
        if time_minutes < 60:
            return f"{time_minutes} minutes"
        else:
            hours = time_minutes // 60
            minutes = time_minutes % 60
            return f"{hours}h {minutes}m"

    def load_balancing_recommendation(self, stations, user_location, plug_type, urgency):
        """
        Implement load balancing using custom min-heap/priority queue
        Returns top 3 recommendations based on composite scoring
        """
        recommendations = []
        
        # Create min-heap based on composite scores (using negative scores for min-heap)
        station_heap = []
        
        for station in stations:
            distance = self.haversine_distance(
                user_location[0], user_location[1],
                station['location']['coordinates'][0],
                station['location']['coordinates'][1]
            )
            
            score = self.calculate_composite_score(station, distance, urgency)
            
            # Use negative score for min-heap (to get max scores first)
            heap_item = (-score, station['id'], station, distance)
            self.min_heap_insert(station_heap, heap_item)
        
        # Extract top recommendations
        processed_count = 0
        while station_heap and len(recommendations) < 3 and processed_count < len(stations):
            heap_item = self.min_heap_extract(station_heap)
            if not heap_item:
                break
                
            neg_score, station_id, station, distance = heap_item
            score = -neg_score
            processed_count += 1
            
            # Check if station has available slots
            availability_score = self.calculate_availability_score(station)
            
            if availability_score > 0:  # Has available slots
                auto_booking = self.auto_book_slot(station, urgency, plug_type)
                
                recommendation = {
                    'station': station,
                    'distance': round(distance, 2),
                    'score': round(score, 3),
                    'availability_score': round(availability_score, 3),
                    'coordinates': station['location']['coordinates'],
                    'auto_booking': auto_booking
                }
                
                recommendations.append(recommendation)
            else:
                # Station is full, continue to next best option
                logger.info(f"Station {station['name']} is full, trying next option")
        
        return recommendations

    def merge_sort_stations(self, stations_with_scores):
        """
        Custom merge sort implementation for sorting stations by score
        """
        if len(stations_with_scores) <= 1:
            return stations_with_scores
        
        # Divide
        mid = len(stations_with_scores) // 2
        left = stations_with_scores[:mid]
        right = stations_with_scores[mid:]
        
        # Conquer
        left_sorted = self.merge_sort_stations(left)
        right_sorted = self.merge_sort_stations(right)
        
        # Merge
        return self.merge_sorted_arrays(left_sorted, right_sorted)
    
    def merge_sorted_arrays(self, left, right):
        """Merge two sorted arrays by score (descending)"""
        result = []
        i = j = 0
        
        while i < len(left) and j < len(right):
            # Sort by score descending (higher scores first)
            if left[i]['score'] >= right[j]['score']:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        
        # Add remaining elements
        while i < len(left):
            result.append(left[i])
            i += 1
            
        while j < len(right):
            result.append(right[j])
            j += 1
        
        return result

    def get_recommendations(self, user_input):
        """
        Main method to get hybrid recommendations using hardcoded algorithms
        
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
            logger.error(f"Error in get_recommendations: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'recommendations': []
            } 