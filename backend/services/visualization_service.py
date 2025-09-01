import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch
import io
import base64
from datetime import datetime
import math

class VisualizationService:
    """Service class for generating charts and visualizations"""
    
    @staticmethod
    def generate_usage_patterns_chart(bookings_data, stations_data):
        """Generate usage patterns chart"""
        try:
            # Set style
            plt.style.use('default')
            plt.rcParams['figure.figsize'] = (12, 8)
            plt.rcParams['font.size'] = 10
            
            # Create figure and subplots
            fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
            fig.suptitle('EV Charging Station Usage Patterns Analysis', fontsize=16, fontweight='bold')
            
            # 1. Station Utilization Chart
            station_utilization = {}
            for station in stations_data:
                station_id = station.get('id')
                station_bookings = [b for b in bookings_data if b.get('station_id') == station_id]
                utilization = len(station_bookings)
                station_utilization[station.get('name', station_id)] = utilization
            
            stations = list(station_utilization.keys())
            utilizations = list(station_utilization.values())
            
            bars1 = ax1.bar(stations, utilizations, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
            ax1.set_title('Station Utilization (Total Bookings)', fontweight='bold')
            ax1.set_xlabel('Charging Stations')
            ax1.set_ylabel('Number of Bookings')
            ax1.tick_params(axis='x', rotation=45)
            
            # Add value labels on bars
            for bar in bars1:
                height = bar.get_height()
                ax1.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                        f'{int(height)}', ha='center', va='bottom')
            
            # 2. Monthly Growth Trend
            monthly_bookings = {}
            for booking in bookings_data:
                if booking.get('created_at'):
                    month_key = booking['created_at'].strftime('%Y-%m')
                    monthly_bookings[month_key] = monthly_bookings.get(month_key, 0) + 1
            
            months = sorted(monthly_bookings.keys())
            monthly_counts = [monthly_bookings[month] for month in months]
            
            ax2.plot(months, monthly_counts, marker='o', linewidth=2, markersize=8, color='#FF6B6B')
            ax2.set_title('Monthly Booking Trends', fontweight='bold')
            ax2.set_xlabel('Month')
            ax2.set_ylabel('Number of Bookings')
            ax2.tick_params(axis='x', rotation=45)
            ax2.grid(True, alpha=0.3)
            
            # 3. User Activity Distribution
            user_booking_counts = {}
            for booking in bookings_data:
                user_id = str(booking.get('user_id', ''))
                if user_id:
                    user_booking_counts[user_id] = user_booking_counts.get(user_id, 0) + 1
            
            activity_levels = ['1-2', '3-5', '6-10', '11+']
            activity_counts = [0, 0, 0, 0]
            
            for count in user_booking_counts.values():
                if count <= 2:
                    activity_counts[0] += 1
                elif count <= 5:
                    activity_counts[1] += 1
                elif count <= 10:
                    activity_counts[2] += 1
                else:
                    activity_counts[3] += 1
            
            colors = ['#FFEAA7', '#96CEB4', '#45B7D1', '#FF6B6B']
            wedges, texts, autotexts = ax3.pie(activity_counts, labels=activity_levels, autopct='%1.1f%%',
                                               colors=colors, startangle=90)
            ax3.set_title('User Activity Distribution', fontweight='bold')
            
            # 4. Average Booking Amount by Station
            station_amounts = {}
            for station in stations_data:
                station_id = station.get('id')
                station_bookings = [b for b in bookings_data if b.get('station_id') == station_id]
                if station_bookings:
                    amounts = [b.get('amount_npr', 0) for b in station_bookings if b.get('amount_npr')]
                    avg_amount = sum(amounts) / len(amounts) if amounts else 0
                    station_amounts[station.get('name', station_id)] = avg_amount
            
            stations_amt = list(station_amounts.keys())
            amounts = list(station_amounts.values())
            
            bars2 = ax4.bar(stations_amt, amounts, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
            ax4.set_title('Average Booking Amount by Station', fontweight='bold')
            ax4.set_xlabel('Charging Stations')
            ax4.set_ylabel('Average Amount (NPR)')
            ax4.tick_params(axis='x', rotation=45)
            
            # Add value labels on bars
            for bar in bars2:
                height = bar.get_height()
                ax4.text(bar.get_x() + bar.get_width()/2., height + 1,
                        f'₹{height:.0f}', ha='center', va='bottom')
            
            plt.tight_layout()
            
            # Convert to base64 string
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
            img_buffer.seek(0)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            plt.close()
            
            return img_base64
            
        except Exception as e:
            print(f"Error generating usage patterns chart: {e}")
            return None
    
    @staticmethod
    def generate_user_clustering_chart(user_clusters):
        """Generate user clustering visualization"""
        try:
            if 'error' in user_clusters or 'clusters' not in user_clusters:
                return None
            
            plt.style.use('default')
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
            fig.suptitle('User Behavior Clustering Analysis', fontsize=16, fontweight='bold')
            
            clusters = user_clusters['clusters']
            
            # 1. Cluster Size Distribution
            cluster_ids = [f"Cluster {c['cluster_id']+1}" for c in clusters]
            cluster_sizes = [c['size'] for c in clusters]
            cluster_colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
            
            bars = ax1.bar(cluster_ids, cluster_sizes, color=cluster_colors[:len(clusters)])
            ax1.set_title('Cluster Size Distribution', fontweight='bold')
            ax1.set_xlabel('Clusters')
            ax1.set_ylabel('Number of Users')
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                ax1.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                        f'{int(height)}', ha='center', va='bottom')
            
            # 2. Cluster Characteristics Radar Chart
            if clusters:
                # Get characteristics for first cluster as example
                cluster = clusters[0]
                characteristics = cluster['characteristics']
                
                categories = list(characteristics.keys())
                values = list(characteristics.values())
                
                # Normalize values for better visualization
                max_val = max(values) if values else 1
                normalized_values = [v/max_val for v in values]
                
                # Create radar chart
                angles = [n / len(categories) * 2 * math.pi for n in range(len(categories))]
                angles += angles[:1]  # Complete the circle
                normalized_values += normalized_values[:1]
                
                ax2 = plt.subplot(1, 2, 2, projection='polar')
                ax2.plot(angles, normalized_values, 'o-', linewidth=2, color='#FF6B6B')
                ax2.fill(angles, normalized_values, alpha=0.25, color='#FF6B6B')
                ax2.set_xticks(angles[:-1])
                ax2.set_xticklabels([cat.replace('avg_', '').replace('_', ' ').title() for cat in categories])
                ax2.set_title(f'Cluster {cluster["cluster_id"]+1} Characteristics', fontweight='bold', pad=20)
                ax2.set_ylim(0, 1)
            
            plt.tight_layout()
            
            # Convert to base64 string
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
            img_buffer.seek(0)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            plt.close()
            
            return img_base64
            
        except Exception as e:
            print(f"Error generating user clustering chart: {e}")
            return None
    
    @staticmethod
    def generate_behavior_patterns_chart(behavior_patterns):
        """Generate behavior patterns visualization"""
        try:
            if 'error' in behavior_patterns or 'pattern_analysis' not in behavior_patterns:
                return None
            
            patterns = behavior_patterns['pattern_analysis']
            if not patterns:
                return None
            
            plt.style.use('default')
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
            fig.suptitle('User Behavior Pattern Analysis', fontsize=16, fontweight='bold')
            
            # 1. Pattern Confidence Levels
            confidences = [p['confidence'] for p in patterns]
            supports = [p['support'] for p in patterns]
            lifts = [p['lift'] for p in patterns]
            
            # Create scatter plot
            scatter = ax1.scatter(confidences, supports, c=lifts, s=100, alpha=0.7, cmap='viridis')
            ax1.set_xlabel('Confidence')
            ax1.set_ylabel('Support')
            ax1.set_title('Pattern Strength Analysis', fontweight='bold')
            ax1.grid(True, alpha=0.3)
            
            # Add colorbar
            cbar = plt.colorbar(scatter, ax=ax1)
            cbar.set_label('Lift')
            
            # 2. Top Patterns by Confidence
            # Sort patterns by confidence and take top 5
            top_patterns = sorted(patterns, key=lambda x: x['confidence'], reverse=True)[:5]
            pattern_names = [f"Pattern {i+1}" for i in range(len(top_patterns))]
            pattern_confidences = [p['confidence'] for p in top_patterns]
            
            bars = ax2.bar(pattern_names, pattern_confidences, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
            ax2.set_title('Top Patterns by Confidence', fontweight='bold')
            ax2.set_xlabel('Patterns')
            ax2.set_ylabel('Confidence')
            ax2.tick_params(axis='x', rotation=45)
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                ax2.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                        f'{height:.3f}', ha='center', va='bottom')
            
            plt.tight_layout()
            
            # Convert to base64 string
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
            img_buffer.seek(0)
            img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
            plt.close()
            
            return img_base64
            
        except Exception as e:
            print(f"Error generating behavior patterns chart: {e}")
            return None
    
    @staticmethod
    def generate_comprehensive_dashboard(bookings_data, users_data, stations_data, user_clusters, behavior_patterns):
        """Generate comprehensive dashboard with all visualizations"""
        try:
            # Generate individual charts
            usage_chart = VisualizationService.generate_usage_patterns_chart(bookings_data, stations_data)
            clustering_chart = VisualizationService.generate_user_clustering_chart(user_clusters)
            patterns_chart = VisualizationService.generate_behavior_patterns_chart(behavior_patterns)
            
            return {
                'usage_patterns': usage_chart,
                'user_clustering': clustering_chart,
                'behavior_patterns': patterns_chart
            }
            
        except Exception as e:
            print(f"Error generating comprehensive dashboard: {e}")
            return None
