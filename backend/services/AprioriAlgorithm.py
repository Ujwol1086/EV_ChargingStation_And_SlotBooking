import logging
from collections import defaultdict, Counter
from itertools import combinations
import math

logger = logging.getLogger(__name__)

class AprioriAlgorithm:
    """
    Apriori Algorithm implementation for association rule mining in EV charging station recommendations.
    
    This algorithm finds frequent patterns in user charging behavior and station preferences
    to improve recommendation accuracy by identifying associations between:
    - Station features and user preferences
    - Charging patterns and optimal recommendations
    - User context and station selection patterns
    """
    
    def __init__(self, min_support=0.1, min_confidence=0.5):
        """
        Initialize Apriori algorithm with support and confidence thresholds.
        
        Args:
            min_support: Minimum support threshold (0.0 to 1.0)
            min_confidence: Minimum confidence threshold (0.0 to 1.0)
        """
        self.min_support = min_support
        self.min_confidence = min_confidence
        self.frequent_itemsets = {}
        self.association_rules = []
        self.transaction_database = []
        
        # Initialize with sample charging patterns (in real implementation, this would come from database)
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """
        Initialize with sample transaction data representing user charging patterns.
        In a real implementation, this would be loaded from a database of historical bookings.
        """
        # Sample transactions representing user charging patterns
        # Each transaction represents a user's charging session with various attributes
        self.transaction_database = [
            # Transaction format: [station_features, user_context, outcome]
            # Station features: ['fast_charging', 'near_highway', 'has_amenities', 'low_price']
            # User context: ['low_battery', 'high_urgency', 'with_passengers', 'ac_on']
            # Outcome: ['satisfied', 'recommended_again']
            
            # High urgency, low battery scenarios
            ['fast_charging', 'near_highway', 'low_battery', 'high_urgency', 'satisfied'],
            ['fast_charging', 'near_highway', 'low_battery', 'high_urgency', 'satisfied'],
            ['fast_charging', 'low_battery', 'high_urgency', 'satisfied'],
            ['fast_charging', 'near_highway', 'low_battery', 'satisfied'],
            
            # Low urgency, high battery scenarios
            ['has_amenities', 'low_price', 'high_battery', 'low_urgency', 'satisfied'],
            ['has_amenities', 'low_price', 'high_battery', 'low_urgency', 'satisfied'],
            ['has_amenities', 'high_battery', 'low_urgency', 'satisfied'],
            ['low_price', 'high_battery', 'low_urgency', 'satisfied'],
            
            # AC and passengers scenarios
            ['fast_charging', 'ac_on', 'with_passengers', 'satisfied'],
            ['fast_charging', 'ac_on', 'with_passengers', 'satisfied'],
            ['has_amenities', 'ac_on', 'with_passengers', 'satisfied'],
            
            # Terrain-based scenarios
            ['fast_charging', 'hilly_terrain', 'satisfied'],
            ['fast_charging', 'hilly_terrain', 'satisfied'],
            ['near_highway', 'hilly_terrain', 'satisfied'],
            
            # Route-based scenarios
            ['near_highway', 'route_travel', 'satisfied'],
            ['near_highway', 'route_travel', 'satisfied'],
            ['fast_charging', 'route_travel', 'satisfied'],
            
            # Mixed scenarios
            ['fast_charging', 'has_amenities', 'low_battery', 'satisfied'],
            ['fast_charging', 'has_amenities', 'high_urgency', 'satisfied'],
            ['low_price', 'has_amenities', 'high_battery', 'satisfied'],
            
            # Negative outcomes (not satisfied)
            ['slow_charging', 'high_price', 'low_battery', 'high_urgency', 'not_satisfied'],
            ['no_amenities', 'high_price', 'high_battery', 'low_urgency', 'not_satisfied'],
            ['slow_charging', 'no_amenities', 'ac_on', 'with_passengers', 'not_satisfied'],
        ]
        
        logger.info(f"Initialized Apriori with {len(self.transaction_database)} sample transactions")
    
    def generate_candidates(self, itemsets, k):
        """
        Generate candidate itemsets of size k+1 from frequent itemsets of size k.
        
        Args:
            itemsets: List of frequent itemsets of size k
            k: Size of current itemsets
            
        Returns:
            List of candidate itemsets of size k+1
        """
        candidates = []
        n = len(itemsets)
        
        # Generate candidates by joining itemsets that share k-1 items
        for i in range(n):
            for j in range(i + 1, n):
                # Check if first k-1 items are the same
                if itemsets[i][:k-1] == itemsets[j][:k-1]:
                    # Create new candidate by combining the itemsets
                    candidate = tuple(sorted(list(itemsets[i]) + [itemsets[j][k-1]]))
                    candidates.append(candidate)
        
        return candidates
    
    def calculate_support(self, itemset):
        """
        Calculate support for an itemset.
        
        Args:
            itemset: Itemset to calculate support for
            
        Returns:
            Support value (0.0 to 1.0)
        """
        if not self.transaction_database:
            return 0.0
        
        count = 0
        for transaction in self.transaction_database:
            if all(item in transaction for item in itemset):
                count += 1
        
        return count / len(self.transaction_database)
    
    def find_frequent_itemsets(self):
        """
        Find all frequent itemsets using the Apriori algorithm.
        
        Returns:
            Dictionary mapping itemset size to list of frequent itemsets
        """
        logger.info("Starting Apriori algorithm to find frequent itemsets")
        
        # Get all unique items from transactions
        all_items = set()
        for transaction in self.transaction_database:
            all_items.update(transaction)
        
        # Find frequent 1-itemsets
        frequent_1_itemsets = []
        for item in all_items:
            support = self.calculate_support([item])
            if support >= self.min_support:
                frequent_1_itemsets.append((item,))
        
        self.frequent_itemsets[1] = frequent_1_itemsets
        logger.info(f"Found {len(frequent_1_itemsets)} frequent 1-itemsets")
        
        # Find frequent k-itemsets for k > 1
        k = 1
        while self.frequent_itemsets[k]:
            k += 1
            candidates = self.generate_candidates(self.frequent_itemsets[k-1], k-1)
            
            frequent_k_itemsets = []
            for candidate in candidates:
                support = self.calculate_support(candidate)
                if support >= self.min_support:
                    frequent_k_itemsets.append(candidate)
            
            self.frequent_itemsets[k] = frequent_k_itemsets
            logger.info(f"Found {len(frequent_k_itemsets)} frequent {k}-itemsets")
        
        # Remove empty itemsets
        self.frequent_itemsets = {k: v for k, v in self.frequent_itemsets.items() if v}
        
        total_itemsets = sum(len(itemsets) for itemsets in self.frequent_itemsets.values())
        logger.info(f"Apriori algorithm completed. Found {total_itemsets} total frequent itemsets")
        
        return self.frequent_itemsets
    
    def generate_association_rules(self):
        """
        Generate association rules from frequent itemsets.
        
        Returns:
            List of association rules with confidence scores
        """
        logger.info("Generating association rules from frequent itemsets")
        
        rules = []
        
        # Generate rules from itemsets of size 2 and above
        for k in range(2, len(self.frequent_itemsets) + 1):
            for itemset in self.frequent_itemsets[k]:
                # Generate all possible rules from this itemset
                for i in range(1, len(itemset)):
                    for antecedent in combinations(itemset, i):
                        consequent = tuple(item for item in itemset if item not in antecedent)
                        
                        # Calculate confidence
                        antecedent_support = self.calculate_support(antecedent)
                        itemset_support = self.calculate_support(itemset)
                        
                        if antecedent_support > 0:
                            confidence = itemset_support / antecedent_support
                            
                            if confidence >= self.min_confidence:
                                rule = {
                                    'antecedent': antecedent,
                                    'consequent': consequent,
                                    'support': itemset_support,
                                    'confidence': confidence,
                                    'lift': confidence / self.calculate_support(consequent) if self.calculate_support(consequent) > 0 else 0
                                }
                                rules.append(rule)
        
        # Sort rules by confidence (descending)
        rules.sort(key=lambda x: x['confidence'], reverse=True)
        self.association_rules = rules
        
        logger.info(f"Generated {len(rules)} association rules")
        return rules
    
    def get_recommendation_insights(self, user_context, station_features):
        """
        Get recommendation insights based on user context and station features using association rules.
        
        Args:
            user_context: Dictionary with user context (battery, urgency, etc.)
            station_features: Dictionary with station features
            
        Returns:
            Dictionary with recommendation insights and confidence scores
        """
        logger.info(f"Getting recommendation insights for context: {user_context}")
        
        # Convert context and features to itemset format
        context_items = []
        feature_items = []
        
        # Convert user context to items
        if user_context.get('battery_percentage', 100) <= 30:
            context_items.append('low_battery')
        elif user_context.get('battery_percentage', 100) >= 80:
            context_items.append('high_battery')
        
        if user_context.get('urgency', 'medium') in ['high', 'emergency']:
            context_items.append('high_urgency')
        elif user_context.get('urgency', 'medium') == 'low':
            context_items.append('low_urgency')
        
        if user_context.get('ac_status', False):
            context_items.append('ac_on')
        
        if user_context.get('passengers', 1) > 1:
            context_items.append('with_passengers')
        
        if user_context.get('terrain', 'flat') in ['hilly', 'steep']:
            context_items.append('hilly_terrain')
        
        if user_context.get('destination_city'):
            context_items.append('route_travel')
        
        # Convert station features to items
        if station_features.get('pricing', 20) <= 15:
            feature_items.append('low_price')
        elif station_features.get('pricing', 20) >= 25:
            feature_items.append('high_price')
        
        if 'Fast' in station_features.get('connector_types', []) or 'Rapid' in station_features.get('connector_types', []):
            feature_items.append('fast_charging')
        else:
            feature_items.append('slow_charging')
        
        if station_features.get('features'):
            feature_items.append('has_amenities')
        else:
            feature_items.append('no_amenities')
        
        # Check if station is near highway (simplified logic)
        if station_features.get('near_highway', False):
            feature_items.append('near_highway')
        
        # Find applicable rules
        applicable_rules = []
        for rule in self.association_rules:
            antecedent = set(rule['antecedent'])
            consequent = set(rule['consequent'])
            
            # Check if rule applies to current context
            context_set = set(context_items)
            feature_set = set(feature_items)
            
            # Rule applies if antecedent is subset of context+features and consequent contains 'satisfied'
            if antecedent.issubset(context_set.union(feature_set)) and 'satisfied' in consequent:
                applicable_rules.append(rule)
        
        # Calculate recommendation score based on applicable rules
        recommendation_score = 0.5  # Base score
        confidence_sum = 0
        rule_count = 0
        
        for rule in applicable_rules:
            if 'satisfied' in rule['consequent']:
                recommendation_score += rule['confidence'] * 0.1  # Boost score based on confidence
                confidence_sum += rule['confidence']
                rule_count += 1
        
        # Normalize score
        if rule_count > 0:
            avg_confidence = confidence_sum / rule_count
            recommendation_score = min(1.0, recommendation_score + avg_confidence * 0.2)
        
        insights = {
            'recommendation_score': recommendation_score,
            'applicable_rules': len(applicable_rules),
            'confidence_boost': confidence_sum if rule_count > 0 else 0,
            'context_items': context_items,
            'feature_items': feature_items,
            'top_rules': applicable_rules[:3]  # Top 3 applicable rules
        }
        
        logger.info(f"Generated insights: score={recommendation_score:.3f}, rules={len(applicable_rules)}")
        return insights
    
    def update_transaction_database(self, new_transactions):
        """
        Update the transaction database with new charging data.
        
        Args:
            new_transactions: List of new transaction records
        """
        self.transaction_database.extend(new_transactions)
        logger.info(f"Updated transaction database with {len(new_transactions)} new transactions")
        
        # Re-run Apriori algorithm with updated data
        self.find_frequent_itemsets()
        self.generate_association_rules()
    
    def get_algorithm_statistics(self):
        """
        Get statistics about the Apriori algorithm results.
        
        Returns:
            Dictionary with algorithm statistics
        """
        total_itemsets = sum(len(itemsets) for itemsets in self.frequent_itemsets.values())
        total_rules = len(self.association_rules)
        
        # Calculate average confidence
        avg_confidence = 0
        if self.association_rules:
            avg_confidence = sum(rule['confidence'] for rule in self.association_rules) / len(self.association_rules)
        
        return {
            'total_transactions': len(self.transaction_database),
            'total_frequent_itemsets': total_itemsets,
            'total_association_rules': total_rules,
            'average_confidence': avg_confidence,
            'min_support': self.min_support,
            'min_confidence': self.min_confidence,
            'itemsets_by_size': {k: len(v) for k, v in self.frequent_itemsets.items()}
        }
    
    def get_top_association_rules(self, limit=10):
        """
        Get top association rules by confidence.
        
        Args:
            limit: Maximum number of rules to return
            
        Returns:
            List of top association rules
        """
        return self.association_rules[:limit]
    
    def explain_recommendation(self, user_context, station_features):
        """
        Provide human-readable explanation for a recommendation based on association rules.
        
        Args:
            user_context: User context dictionary
            station_features: Station features dictionary
            
        Returns:
            String explanation of the recommendation
        """
        insights = self.get_recommendation_insights(user_context, station_features)
        
        if not insights['top_rules']:
            return "No specific patterns found for this recommendation."
        
        explanations = []
        for rule in insights['top_rules']:
            antecedent_str = " + ".join(rule['antecedent'])
            consequent_str = " + ".join(rule['consequent'])
            confidence = rule['confidence']
            
            explanation = f"When {antecedent_str} → {consequent_str} (confidence: {confidence:.2f})"
            explanations.append(explanation)
        
        return "Recommendation based on patterns: " + "; ".join(explanations)
