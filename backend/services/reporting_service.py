import math
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import logging
import itertools
import random

logger = logging.getLogger(__name__)

class ReportingService:
    """Service class for generating comprehensive reports using various algorithms"""
    
    @staticmethod
    def generate_comprehensive_report(bookings_data, users_data, stations_data):
        """Generate comprehensive report using all algorithms"""
        try:
            logger.info("Generating comprehensive report...")
            
            # Basic statistical analysis
            basic_stats = ReportingService._basic_statistical_analysis(bookings_data, users_data, stations_data)
            
            # K-Means clustering for user behavior
            user_clusters = ReportingService._kmeans_user_clustering(bookings_data, users_data)
            
            # Hierarchical clustering for user relationships
            user_hierarchy = ReportingService._hierarchical_user_clustering(bookings_data, users_data)
            
            # Apriori algorithm for behavior patterns
            behavior_patterns = ReportingService._apriori_behavior_analysis(bookings_data, stations_data)
            
            # Generate insights and recommendations
            insights = ReportingService._generate_insights(basic_stats, user_clusters, user_hierarchy, behavior_patterns)
            
            report = {
                'timestamp': datetime.now().isoformat(),
                'basic_statistics': basic_stats,
                'user_clustering': user_clusters,
                'user_hierarchy': user_hierarchy,
                'behavior_patterns': behavior_patterns,
                'insights': insights,
                'summary': {
                    'total_users': len(users_data),
                    'total_bookings': len(bookings_data),
                    'total_stations': len(stations_data),
                    'analysis_period': 'All time',
                    'algorithms_used': ['K-Means', 'Hierarchical Clustering', 'Apriori', 'Statistical Analysis']
                }
            }
            
            logger.info("Comprehensive report generated successfully")
            return report
            
        except Exception as e:
            logger.error(f"Error generating comprehensive report: {e}")
            return None
    
    @staticmethod
    def _basic_statistical_analysis(bookings_data, users_data, stations_data):
        """Perform basic statistical analysis on the data"""
        try:
            logger.info("Performing basic statistical analysis...")
            
            # Calculate basic metrics
            total_bookings = len(bookings_data)
            total_users = len(users_data)
            total_stations = len(stations_data)
            
            if total_bookings == 0:
                return {'error': 'No booking data available for analysis'}
            
            # Booking statistics
            booking_amounts = [b.get('amount_npr', 0) for b in bookings_data if b.get('amount_npr')]
            avg_booking_amount = sum(booking_amounts) / len(booking_amounts) if booking_amounts else 0
            
            # Time-based analysis
            current_time = datetime.now()
            recent_bookings = [
                b for b in bookings_data 
                if b.get('created_at') and (current_time - b['created_at']).days <= 30
            ]
            
            # Monthly growth calculation
            monthly_bookings = defaultdict(int)
            for booking in bookings_data:
                if booking.get('created_at'):
                    month_key = booking['created_at'].strftime('%Y-%m')
                    monthly_bookings[month_key] += 1
            
            # Calculate growth rates
            monthly_growth = []
            months = sorted(monthly_bookings.keys())
            for i in range(1, len(months)):
                current = monthly_bookings[months[i]]
                previous = monthly_bookings[months[i-1]]
                growth_rate = ((current - previous) / previous * 100) if previous > 0 else 0
                monthly_growth.append({
                    'month': months[i],
                    'bookings': current,
                    'growth_rate': round(growth_rate, 2)
                })
            
            # Station utilization
            station_utilization = {}
            for station in stations_data:
                station_id = station.get('id')
                station_bookings = [b for b in bookings_data if b.get('station_id') == station_id]
                utilization = len(station_bookings) / total_bookings * 100 if total_bookings > 0 else 0
                station_utilization[station.get('name', station_id)] = round(utilization, 2)
            
            # User activity analysis
            user_booking_counts = defaultdict(int)
            for booking in bookings_data:
                user_id = str(booking.get('user_id', ''))
                if user_id:
                    user_booking_counts[user_id] += 1
            
            avg_bookings_per_user = sum(user_booking_counts.values()) / len(user_booking_counts) if user_booking_counts else 0
            most_active_users = sorted(user_booking_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            
            stats = {
                'overview': {
                    'total_bookings': total_bookings,
                    'total_users': total_users,
                    'total_stations': total_stations,
                    'avg_booking_amount': round(avg_booking_amount, 2)
                },
                'growth_metrics': {
                    'recent_bookings_30d': len(recent_bookings),
                    'monthly_growth': monthly_growth,
                    'avg_bookings_per_user': round(avg_bookings_per_user, 2)
                },
                'station_analysis': {
                    'utilization_by_station': station_utilization,
                    'most_utilized': max(station_utilization.items(), key=lambda x: x[1]) if station_utilization else None
                },
                'user_analysis': {
                    'most_active_users': most_active_users,
                    'avg_bookings_per_user': round(avg_bookings_per_user, 2)
                }
            }
            
            logger.info("Basic statistical analysis completed")
            return stats
            
        except Exception as e:
            logger.error(f"Error in basic statistical analysis: {e}")
            return {'error': str(e)}
    
    @staticmethod
    def _kmeans_user_clustering(bookings_data, users_data, k=3):
        """Perform K-Means clustering on users based on their behavior"""
        try:
            logger.info(f"Performing K-Means clustering with {k} clusters...")
            
            if not bookings_data or not users_data:
                return {'error': 'Insufficient data for clustering'}
            
            # Extract user behavior features
            user_features = []
            user_ids = []
            
            for user in users_data:
                user_id = str(user.get('_id', ''))
                if not user_id:
                    continue
                
                # Get user's bookings
                user_bookings = [b for b in bookings_data if str(b.get('user_id', '')) == user_id]
                
                if not user_bookings:
                    # User with no bookings - assign default features
                    features = [0, 0, 0, 0, 0]
                else:
                    # Calculate features
                    total_bookings = len(user_bookings)
                    amounts = [b.get('amount_npr', 0) for b in user_bookings if b.get('amount_npr')]
                    avg_amount = sum(amounts) / len(amounts) if amounts else 0
                    
                    # Frequency (bookings per month)
                    if user_bookings:
                        first_booking = min(user_bookings, key=lambda x: x.get('created_at', datetime.max))
                        last_booking = max(user_bookings, key=lambda x: x.get('created_at', datetime.min))
                        if first_booking.get('created_at') and last_booking.get('created_at'):
                            months_diff = (last_booking['created_at'] - first_booking['created_at']).days / 30
                            frequency = total_bookings / max(months_diff, 1)
                        else:
                            frequency = total_bookings
                    else:
                        frequency = 0
                    
                    # Average duration
                    durations = [b.get('estimated_duration', 60) for b in user_bookings if b.get('estimated_duration')]
                    avg_duration = sum(durations) / len(durations) if durations else 60
                    
                    # Station variety (unique stations used)
                    unique_stations = len(set(b.get('station_id') for b in user_bookings if b.get('station_id')))
                    
                    features = [total_bookings, avg_amount, frequency, avg_duration, unique_stations]
                
                user_features.append(features)
                user_ids.append(user_id)
            
            if len(user_features) < k:
                return {'error': f'Not enough users for {k} clusters'}
            
            # Normalize features
            user_features = ReportingService._normalize_features(user_features)
            
            # Perform K-Means clustering
            centroids, labels = ReportingService._kmeans_algorithm(user_features, k)
            
            # Analyze clusters
            clusters_analysis = []
            for i in range(k):
                cluster_indices = [j for j, label in enumerate(labels) if label == i]
                cluster_users = [user_ids[j] for j in cluster_indices]
                cluster_features = [user_features[j] for j in cluster_indices]
                
                if cluster_features:
                    avg_features = ReportingService._calculate_mean_features(cluster_features)
                    cluster_analysis = {
                        'cluster_id': i,
                        'size': len(cluster_users),
                        'user_ids': cluster_users,
                        'characteristics': {
                            'avg_total_bookings': round(avg_features[0], 2),
                            'avg_amount': round(avg_features[1], 2),
                            'avg_frequency': round(avg_features[2], 2),
                            'avg_duration': round(avg_features[3], 2),
                            'avg_station_variety': round(avg_features[4], 2)
                        },
                        'segment_type': ReportingService._classify_user_segment(avg_features)
                    }
                    clusters_analysis.append(cluster_analysis)
            
            result = {
                'algorithm': 'K-Means Clustering',
                'num_clusters': k,
                'clusters': clusters_analysis,
                'total_users_analyzed': len(user_ids),
                'features_used': ['Total Bookings', 'Average Amount', 'Frequency', 'Average Duration', 'Station Variety']
            }
            
            logger.info(f"K-Means clustering completed with {k} clusters")
            return result
            
        except Exception as e:
            logger.error(f"Error in K-Means clustering: {e}")
            return {'error': str(e)}
    
    @staticmethod
    def _kmeans_algorithm(data, k, max_iterations=100):
        """Implement K-Means clustering algorithm"""
        try:
            n_samples = len(data)
            n_features = len(data[0]) if data else 0
            
            if n_samples == 0:
                return None, None
            
            # Initialize centroids randomly
            centroids = [data[random.randint(0, n_samples-1)] for _ in range(k)]
            
            for iteration in range(max_iterations):
                # Assign points to nearest centroid
                labels = []
                for point in data:
                    distances = [ReportingService._euclidean_distance(point, centroid) for centroid in centroids]
                    labels.append(distances.index(min(distances)))
                
                # Update centroids
                new_centroids = []
                for i in range(k):
                    cluster_points = [data[j] for j in range(n_samples) if labels[j] == i]
                    if cluster_points:
                        new_centroid = ReportingService._calculate_mean_features(cluster_points)
                        new_centroids.append(new_centroid)
                    else:
                        new_centroids.append(centroids[i])
                
                # Check for convergence
                if ReportingService._centroids_converged(centroids, new_centroids):
                    break
                
                centroids = new_centroids
            
            return centroids, labels
            
        except Exception as e:
            logger.error(f"Error in K-Means algorithm: {e}")
            return None, None
    
    @staticmethod
    def _euclidean_distance(point1, point2):
        """Calculate Euclidean distance between two points"""
        try:
            return math.sqrt(sum((a - b) ** 2 for a, b in zip(point1, point2)))
        except Exception:
            return float('inf')
    
    @staticmethod
    def _calculate_mean_features(features_list):
        """Calculate mean of features"""
        try:
            if not features_list:
                return [0] * len(features_list[0]) if features_list else []
            
            n_features = len(features_list[0])
            means = []
            
            for i in range(n_features):
                feature_values = [f[i] for f in features_list if len(f) > i]
                means.append(sum(feature_values) / len(feature_values) if feature_values else 0)
            
            return means
        except Exception:
            return [0] * len(features_list[0]) if features_list else []
    
    @staticmethod
    def _centroids_converged(old_centroids, new_centroids, tolerance=1e-6):
        """Check if centroids have converged"""
        try:
            if len(old_centroids) != len(new_centroids):
                return False
            
            for old, new in zip(old_centroids, new_centroids):
                if len(old) != len(new):
                    return False
                
                for o, n in zip(old, new):
                    if abs(o - n) > tolerance:
                        return False
            
            return True
        except Exception:
            return False
    
    @staticmethod
    def _normalize_features(features):
        """Normalize features using min-max scaling"""
        try:
            if not features:
                return features
            
            n_features = len(features[0])
            normalized = []
            
            for i in range(n_features):
                feature_values = [f[i] for f in features if len(f) > i]
                if not feature_values:
                    continue
                
                min_val = min(feature_values)
                max_val = max(feature_values)
                
                # Avoid division by zero
                range_val = max_val - min_val
                if range_val == 0:
                    range_val = 1
                
                normalized_feature = [(val - min_val) / range_val for val in feature_values]
                normalized.append(normalized_feature)
            
            # Transpose to get back to original format
            if normalized:
                return [[normalized[j][i] for j in range(len(normalized))] for i in range(len(normalized[0]))]
            
            return features
            
        except Exception as e:
            logger.error(f"Error normalizing features: {e}")
            return features
    
    @staticmethod
    def _hierarchical_user_clustering(bookings_data, users_data):
        """Perform hierarchical clustering to show user relationships"""
        try:
            logger.info("Performing hierarchical clustering...")
            
            if not bookings_data or not users_data:
                return {'error': 'Insufficient data for hierarchical clustering'}
            
            # Create user similarity matrix
            user_similarities = []
            user_ids = []
            
            for user in users_data:
                user_id = str(user.get('_id', ''))
                if not user_id:
                    continue
                
                user_ids.append(user_id)
                user_bookings = [b for b in bookings_data if str(b.get('user_id', '')) == user_id]
                
                # Calculate user profile
                profile = ReportingService._calculate_user_profile(user_bookings)
                user_similarities.append(profile)
            
            if len(user_similarities) < 2:
                return {'error': 'Not enough users for hierarchical clustering'}
            
            # Perform hierarchical clustering
            dendrogram = ReportingService._hierarchical_clustering_algorithm(user_similarities)
            
            # Create user family tree
            user_tree = ReportingService._create_user_family_tree(user_ids, dendrogram)
            
            result = {
                'algorithm': 'Hierarchical Clustering',
                'dendrogram': dendrogram,
                'user_family_tree': user_tree,
                'total_users_analyzed': len(user_ids),
                'clustering_method': 'Ward (Minimum Variance)'
            }
            
            logger.info("Hierarchical clustering completed")
            return result
            
        except Exception as e:
            logger.error(f"Error in hierarchical clustering: {e}")
            return {'error': str(e)}
    
    @staticmethod
    def _hierarchical_clustering_algorithm(data):
        """Implement hierarchical clustering algorithm"""
        try:
            n_samples = len(data)
            
            # Initialize clusters (each user is a cluster)
            clusters = [[i] for i in range(n_samples)]
            
            # Calculate initial distance matrix
            distances = [[0] * n_samples for _ in range(n_samples)]
            for i in range(n_samples):
                for j in range(i + 1, n_samples):
                    distance = ReportingService._euclidean_distance(data[i], data[j])
                    distances[i][j] = distance
                    distances[j][i] = distance
            
            # Perform hierarchical clustering
            dendrogram = []
            while len(clusters) > 1:
                # Find closest clusters
                min_distance = float('inf')
                merge_i, merge_j = 0, 0
                
                for i in range(len(clusters)):
                    for j in range(i + 1, len(clusters)):
                        # Calculate cluster distance (Ward method)
                        cluster_distance = ReportingService._calculate_cluster_distance(
                            clusters[i], clusters[j], distances
                        )
                        if cluster_distance < min_distance:
                            min_distance = cluster_distance
                            merge_i, merge_j = i, j
                
                # Merge clusters
                merged_cluster = clusters[merge_i] + clusters[merge_j]
                dendrogram.append({
                    'clusters': [clusters[merge_i], clusters[merge_j]],
                    'distance': min_distance,
                    'merged_cluster': merged_cluster
                })
                
                # Remove old clusters and add merged one
                clusters.pop(max(merge_i, merge_j))
                clusters.pop(min(merge_i, merge_j))
                clusters.append(merged_cluster)
            
            return dendrogram
            
        except Exception as e:
            logger.error(f"Error in hierarchical clustering algorithm: {e}")
            return []
    
    @staticmethod
    def _calculate_cluster_distance(cluster1, cluster2, distances):
        """Calculate distance between two clusters using Ward method"""
        try:
            total_distance = 0
            count = 0
            
            for i in cluster1:
                for j in cluster2:
                    total_distance += distances[i][j]
                    count += 1
            
            return total_distance / count if count > 0 else float('inf')
            
        except Exception as e:
            logger.error(f"Error calculating cluster distance: {e}")
            return float('inf')
    
    @staticmethod
    def _calculate_user_profile(bookings):
        """Calculate user profile vector for similarity calculation"""
        try:
            if not bookings:
                return [0, 0, 0, 0]
            
            # Extract features
            amounts = [b.get('amount_npr', 0) for b in bookings if b.get('amount_npr')]
            durations = [b.get('estimated_duration', 60) for b in bookings if b.get('estimated_duration')]
            stations = [b.get('station_id') for b in bookings if b.get('station_id')]
            
            # Calculate profile
            avg_amount = sum(amounts) / len(amounts) if amounts else 0
            avg_duration = sum(durations) / len(durations) if durations else 60
            total_bookings = len(bookings)
            unique_stations = len(set(stations))
            
            return [avg_amount, avg_duration, total_bookings, unique_stations]
            
        except Exception as e:
            logger.error(f"Error calculating user profile: {e}")
            return [0, 0, 0, 0]
    
    @staticmethod
    def _create_user_family_tree(user_ids, dendrogram):
        """Create user family tree from dendrogram"""
        try:
            tree = {
                'root': {
                    'type': 'root',
                    'children': [],
                    'level': 0
                }
            }
            
            # Build tree from dendrogram
            for level, merge in enumerate(dendrogram):
                node_id = f"level_{level}"
                tree[node_id] = {
                    'type': 'merge',
                    'children': merge['clusters'],
                    'distance': merge['distance'],
                    'level': level + 1
                }
            
            return tree
            
        except Exception as e:
            logger.error(f"Error creating user family tree: {e}")
            return {}
    
    @staticmethod
    def _classify_user_segment(features):
        """Classify user segment based on features"""
        try:
            total_bookings, avg_amount, frequency, avg_duration, station_variety = features
            
            if total_bookings >= 10 and frequency >= 2:
                return "High-Value Frequent User"
            elif total_bookings >= 5 and avg_amount >= 100:
                return "Premium User"
            elif frequency >= 1.5:
                return "Regular User"
            elif total_bookings >= 3:
                return "Occasional User"
            else:
                return "New User"
                
        except Exception as e:
            logger.error(f"Error classifying user segment: {e}")
            return "Unknown"
    
    @staticmethod
    def _apriori_behavior_analysis(bookings_data, stations_data, min_support=0.1, min_confidence=0.5):
        """Implement Apriori algorithm to find behavior patterns"""
        try:
            logger.info("Performing Apriori behavior analysis...")
            
            if not bookings_data:
                return {'error': 'No booking data for Apriori analysis'}
            
            # Extract transaction data (user booking sequences)
            transactions = []
            user_booking_sequences = defaultdict(list)
            
            for booking in bookings_data:
                user_id = str(booking.get('user_id', ''))
                station_id = booking.get('station_id', '')
                if user_id and station_id:
                    user_booking_sequences[user_id].append(station_id)
            
            # Convert to transaction format
            for user_id, sequence in user_booking_sequences.items():
                if len(sequence) >= 2:  # Only consider users with multiple bookings
                    transactions.append(sequence)
            
            if len(transactions) < 2:
                return {'error': 'Insufficient transaction data for Apriori analysis'}
            
            # Find frequent itemsets
            frequent_itemsets = ReportingService._apriori_find_frequent_itemsets(
                transactions, min_support
            )
            
            # Generate association rules
            association_rules = ReportingService._apriori_generate_rules(
                frequent_itemsets, transactions, min_confidence
            )
            
            # Analyze patterns
            pattern_analysis = ReportingService._analyze_behavior_patterns(
                association_rules, stations_data
            )
            
            result = {
                'algorithm': 'Apriori Algorithm',
                'min_support': min_support,
                'min_confidence': min_confidence,
                'total_transactions': len(transactions),
                'frequent_itemsets': frequent_itemsets,
                'association_rules': association_rules,
                'pattern_analysis': pattern_analysis,
                'cross_selling_opportunities': ReportingService._identify_cross_selling_opportunities(
                    association_rules, stations_data
                )
            }
            
            logger.info("Apriori behavior analysis completed")
            return result
            
        except Exception as e:
            logger.error(f"Error in Apriori behavior analysis: {e}")
            return {'error': str(e)}
    
    @staticmethod
    def _apriori_find_frequent_itemsets(transactions, min_support):
        """Find frequent itemsets using Apriori algorithm"""
        try:
            # Count single items
            item_counts = Counter()
            for transaction in transactions:
                for item in transaction:
                    item_counts[item] += 1
            
            # Calculate support for single items
            total_transactions = len(transactions)
            frequent_1_itemsets = {
                frozenset([item]): count / total_transactions
                for item, count in item_counts.items()
                if count / total_transactions >= min_support
            }
            
            frequent_itemsets = {1: frequent_1_itemsets}
            k = 2
            
            # Generate k-itemsets
            while frequent_itemsets[k-1]:
                candidate_itemsets = ReportingService._generate_candidates(
                    frequent_itemsets[k-1], k
                )
                
                # Count candidates
                candidate_counts = Counter()
                for transaction in transactions:
                    transaction_set = frozenset(transaction)
                    for candidate in candidate_counts:
                        if candidate.issubset(transaction_set):
                            candidate_counts[candidate] += 1
                
                # Filter by support
                frequent_k_itemsets = {
                    itemset: count / total_transactions
                    for itemset, count in candidate_counts.items()
                    if count / total_transactions >= min_support
                }
                
                if frequent_k_itemsets:
                    frequent_itemsets[k] = frequent_k_itemsets
                k += 1
            
            return frequent_itemsets
            
        except Exception as e:
            logger.error(f"Error finding frequent itemsets: {e}")
            return {}
    
    @staticmethod
    def _generate_candidates(prev_frequent, k):
        """Generate candidate k-itemsets from (k-1)-itemsets"""
        try:
            candidates = set()
            prev_itemsets = list(prev_frequent.keys())
            
            for i in range(len(prev_itemsets)):
                for j in range(i + 1, len(prev_itemsets)):
                    itemset1 = prev_itemsets[i]
                    itemset2 = prev_itemsets[j]
                    
                    # Check if first k-2 elements are the same
                    if list(itemset1)[:k-2] == list(itemset2)[:k-2]:
                        # Create new candidate
                        new_candidate = itemset1.union(itemset2)
                        if len(new_candidate) == k:
                            candidates.add(new_candidate)
            
            return candidates
            
        except Exception as e:
            logger.error(f"Error generating candidates: {e}")
            return set()
    
    @staticmethod
    def _apriori_generate_rules(frequent_itemsets, transactions, min_confidence):
        """Generate association rules from frequent itemsets"""
        try:
            rules = []
            
            for k in range(2, len(frequent_itemsets) + 1):
                if k not in frequent_itemsets:
                    continue
                
                for itemset in frequent_itemsets[k]:
                    items = list(itemset)
                    
                    # Generate all possible rules
                    for i in range(1, len(items)):
                        for antecedent in itertools.combinations(items, i):
                            consequent = tuple(item for item in items if item not in antecedent)
                            
                            # Calculate confidence
                            antecedent_support = ReportingService._calculate_support(
                                frozenset(antecedent), transactions
                            )
                            rule_support = frequent_itemsets[k][itemset]
                            
                            if antecedent_support > 0:
                                confidence = rule_support / antecedent_support
                                
                                if confidence >= min_confidence:
                                    rules.append({
                                        'antecedent': list(antecedent),
                                        'consequent': list(consequent),
                                        'support': rule_support,
                                        'confidence': confidence,
                                        'lift': confidence / ReportingService._calculate_support(
                                            frozenset(consequent), transactions
                                        )
                                    })
            
            return rules
            
        except Exception as e:
            logger.error(f"Error generating association rules: {e}")
            return []
    
    @staticmethod
    def _calculate_support(itemset, transactions):
        """Calculate support for an itemset"""
        try:
            count = sum(1 for transaction in transactions if itemset.issubset(transaction))
            return count / len(transactions)
        except Exception as e:
            logger.error(f"Error calculating support: {e}")
            return 0
    
    @staticmethod
    def _analyze_behavior_patterns(association_rules, stations_data):
        """Analyze discovered behavior patterns"""
        try:
            patterns = []
            
            for rule in association_rules:
                antecedent_stations = rule['antecedent']
                consequent_stations = rule['consequent']
                
                # Get station names
                antecedent_names = [
                    next((s.get('name', sid) for s in stations_data if s.get('id') == sid), sid)
                    for sid in antecedent_stations
                ]
                consequent_names = [
                    next((s.get('name', sid) for s in stations_data if s.get('id') == sid), sid)
                    for sid in consequent_stations
                ]
                
                pattern = {
                    'description': f"Users who book at {', '.join(antecedent_names)} often book at {', '.join(consequent_names)}",
                    'confidence': round(rule['confidence'], 3),
                    'support': round(rule['support'], 3),
                    'lift': round(rule['lift'], 3),
                    'business_implication': ReportingService._get_business_implication(rule)
                }
                patterns.append(pattern)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error analyzing behavior patterns: {e}")
            return []
    
    @staticmethod
    def _identify_cross_selling_opportunities(association_rules, stations_data):
        """Identify cross-selling opportunities from association rules"""
        try:
            opportunities = []
            
            for rule in association_rules:
                if rule['confidence'] >= 0.7 and rule['lift'] >= 1.5:
                    antecedent_stations = rule['antecedent']
                    consequent_stations = rule['consequent']
                    
                    opportunity = {
                        'antecedent_stations': antecedent_stations,
                        'consequent_stations': consequent_stations,
                        'confidence': rule['confidence'],
                        'recommendation': f"Promote {', '.join(consequent_stations)} to users of {', '.join(antecedent_stations)}",
                        'expected_success_rate': round(rule['confidence'] * 100, 1)
                    }
                    opportunities.append(opportunity)
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Error identifying cross-selling opportunities: {e}")
            return []
    
    @staticmethod
    def _get_business_implication(rule):
        """Get business implication from association rule"""
        try:
            confidence = rule['confidence']
            lift = rule['lift']
            
            if confidence >= 0.8 and lift >= 2.0:
                return "Strong relationship - High priority for business strategy"
            elif confidence >= 0.6 and lift >= 1.5:
                return "Moderate relationship - Consider for targeted marketing"
            elif confidence >= 0.4 and lift >= 1.2:
                return "Weak relationship - Monitor for trends"
            else:
                return "Minimal relationship - Low priority"
                
        except Exception as e:
            logger.error(f"Error getting business implication: {e}")
            return "Unknown"
    
    @staticmethod
    def _generate_insights(basic_stats, user_clusters, user_hierarchy, behavior_patterns):
        """Generate actionable insights from all analyses"""
        try:
            insights = []
            
            # Basic stats insights
            if 'overview' in basic_stats:
                total_bookings = basic_stats['overview'].get('total_bookings', 0)
                if total_bookings > 100:
                    insights.append("High booking volume indicates strong market demand")
                elif total_bookings < 50:
                    insights.append("Low booking volume suggests need for marketing campaigns")
            
            # User clustering insights
            if 'clusters' in user_clusters:
                cluster_sizes = [c.get('size', 0) for c in user_clusters['clusters']]
                if max(cluster_sizes) > sum(cluster_sizes) * 0.6:
                    insights.append("User base is highly concentrated - consider diversification strategies")
                
                for cluster in user_clusters['clusters']:
                    segment = cluster.get('segment_type', '')
                    if 'High-Value' in segment:
                        insights.append(f"Focus on retaining {segment}s - they drive significant revenue")
            
            # Behavior pattern insights
            if 'pattern_analysis' in behavior_patterns:
                strong_patterns = [p for p in behavior_patterns['pattern_analysis'] if p.get('confidence', 0) >= 0.7]
                if strong_patterns:
                    insights.append(f"Found {len(strong_patterns)} strong behavior patterns for targeted marketing")
            
            # Cross-selling insights
            if 'cross_selling_opportunities' in behavior_patterns:
                opportunities = behavior_patterns.get('cross_selling_opportunities', [])
                if opportunities:
                    insights.append(f"Identified {len(opportunities)} cross-selling opportunities")
            
            return insights if insights else ["No specific insights available with current data"]
            
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return ["Error generating insights"]
    
    @staticmethod
    def _get_current_timestamp():
        """Get current timestamp in ISO format"""
        return datetime.now().isoformat()
