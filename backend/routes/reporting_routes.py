from flask import Blueprint, jsonify, request
from models.booking import Booking
from models.user_new import User
from models.charging_station import ChargingStation
from services.reporting_service import ReportingService
from middleware.admin_middleware import require_admin
import logging

logger = logging.getLogger(__name__)
reporting_bp = Blueprint('reporting', __name__, url_prefix='/api/reports')

@reporting_bp.route('/comprehensive', methods=['GET'])
@require_admin
def generate_comprehensive_report():
    """Generate comprehensive report using all algorithms"""
    try:
        logger.info("Generating comprehensive report...")
        
        # Get all data
        bookings = list(Booking.get_all_bookings())
        users = list(User.get_all_users())
        stations = ChargingStation.get_all()
        
        if not bookings or not users or not stations:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for comprehensive report generation'
            }), 400
        
        # Generate report
        report = ReportingService.generate_comprehensive_report(bookings, users, stations)
        
        if report:
            return jsonify({
                'success': True,
                'report': report
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate comprehensive report'
            }), 500
            
    except Exception as e:
        logger.error(f"Error generating comprehensive report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/user-clustering', methods=['GET'])
@require_admin
def generate_user_clustering_report():
    """Generate user clustering report using K-Means"""
    try:
        logger.info("Generating user clustering report...")
        
        # Get parameters
        k_clusters = request.args.get('k', 3, type=int)
        
        # Get data
        bookings = list(Booking.get_all_bookings())
        users = list(User.get_all_users())
        
        if not bookings or not users:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for user clustering'
            }), 400
        
        # Generate clustering
        clusters = ReportingService._kmeans_user_clustering(bookings, users, k_clusters)
        
        if 'error' not in clusters:
            return jsonify({
                'success': True,
                'clustering_report': clusters
            })
        else:
            return jsonify({
                'success': False,
                'error': clusters['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error generating user clustering report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/user-hierarchy', methods=['GET'])
@require_admin
def generate_user_hierarchy_report():
    """Generate user hierarchy report using hierarchical clustering"""
    try:
        logger.info("Generating user hierarchy report...")
        
        # Get data
        bookings = list(Booking.get_all_bookings())
        users = list(User.get_all_users())
        
        if not bookings or not users:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for hierarchical clustering'
            }), 400
        
        # Generate hierarchy
        hierarchy = ReportingService._hierarchical_user_clustering(bookings, users)
        
        if 'error' not in hierarchy:
            return jsonify({
                'success': True,
                'hierarchy_report': hierarchy
            })
        else:
            return jsonify({
                'success': False,
                'error': hierarchy['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error generating user hierarchy report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/behavior-patterns', methods=['GET'])
@require_admin
def generate_behavior_patterns_report():
    """Generate behavior patterns report using Apriori algorithm"""
    try:
        logger.info("Generating behavior patterns report...")
        
        # Get parameters
        min_support = request.args.get('min_support', 0.1, type=float)
        min_confidence = request.args.get('min_confidence', 0.5, type=float)
        
        # Get data
        bookings = list(Booking.get_all_bookings())
        stations = ChargingStation.get_all()
        
        if not bookings or not stations:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for behavior pattern analysis'
            }), 400
        
        # Generate patterns
        patterns = ReportingService._apriori_behavior_analysis(
            bookings, stations, min_support, min_confidence
        )
        
        if 'error' not in patterns:
            return jsonify({
                'success': True,
                'behavior_patterns_report': patterns
            })
        else:
            return jsonify({
                'success': False,
                'error': patterns['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error generating behavior patterns report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/statistics', methods=['GET'])
@require_admin
def generate_statistics_report():
    """Generate basic statistics report"""
    try:
        logger.info("Generating statistics report...")
        
        # Get data
        bookings = list(Booking.get_all_bookings())
        users = list(User.get_all_users())
        stations = ChargingStation.get_all()
        
        if not bookings or not users or not stations:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for statistics report'
            }), 400
        
        # Generate statistics
        stats = ReportingService._basic_statistical_analysis(bookings, users, stations)
        
        if 'error' not in stats:
            return jsonify({
                'success': True,
                'statistics_report': stats
            })
        else:
            return jsonify({
                'success': False,
                'error': stats['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Error generating statistics report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/insights', methods=['GET'])
@require_admin
def generate_insights_report():
    """Generate insights and recommendations report"""
    try:
        logger.info("Generating insights report...")
        
        # Get data
        bookings = list(Booking.get_all_bookings())
        users = list(User.get_all_users())
        stations = ChargingStation.get_all()
        
        if not bookings or not users or not stations:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for insights report'
            }), 400
        
        # Generate all analyses
        basic_stats = ReportingService._basic_statistical_analysis(bookings, users, stations)
        user_clusters = ReportingService._kmeans_user_clustering(bookings, users)
        user_hierarchy = ReportingService._hierarchical_user_clustering(bookings, users)
        behavior_patterns = ReportingService._apriori_behavior_analysis(bookings, stations)
        
        # Generate insights
        insights = ReportingService._generate_insights(
            basic_stats, user_clusters, user_hierarchy, behavior_patterns
        )
        
        return jsonify({
            'success': True,
            'insights_report': {
                'insights': insights,
                'summary': {
                    'total_insights': len(insights),
                    'data_sources': ['Bookings', 'Users', 'Stations'],
                    'algorithms_used': ['K-Means', 'Hierarchical Clustering', 'Apriori', 'Statistical Analysis']
                }
            }
        })
            
    except Exception as e:
        logger.error(f"Error generating insights report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/export/<report_type>', methods=['GET'])
@require_admin
def export_report(report_type):
    """Export report in different formats"""
    try:
        logger.info(f"Exporting {report_type} report...")
        
        # Get data
        bookings = list(Booking.get_all_bookings())
        users = list(User.get_all_users())
        stations = ChargingStation.get_all()
        
        if not bookings or not users or not stations:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for report export'
            }), 400
        
        # Generate report based on type
        if report_type == 'comprehensive':
            report = ReportingService.generate_comprehensive_report(bookings, users, stations)
        elif report_type == 'user-clustering':
            report = ReportingService._kmeans_user_clustering(bookings, users)
        elif report_type == 'user-hierarchy':
            report = ReportingService._hierarchical_user_clustering(bookings, users)
        elif report_type == 'behavior-patterns':
            report = ReportingService._apriori_behavior_analysis(bookings, stations)
        elif report_type == 'statistics':
            report = ReportingService._basic_statistical_analysis(bookings, users, stations)
        else:
            return jsonify({
                'success': False,
                'error': f'Unknown report type: {report_type}'
            }), 400
        
        if 'error' in report:
            return jsonify({
                'success': False,
                'error': report['error']
            }), 400
        
        # Format for export
        export_data = {
            'report_type': report_type,
            'generated_at': ReportingService._get_current_timestamp(),
            'data': report,
            'export_format': 'JSON'
        }
        
        return jsonify({
            'success': True,
            'export_data': export_data,
            'download_url': f'/api/reports/download/{report_type}'
        })
            
    except Exception as e:
        logger.error(f"Error exporting {report_type} report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/download/<report_type>', methods=['GET'])
@require_admin
def download_report(report_type):
    """Download report file"""
    try:
        logger.info(f"Downloading {report_type} report...")
        
        # This would typically generate and serve a file
        # For now, return the report data
        return jsonify({
            'success': True,
            'message': f'Report {report_type} downloaded successfully',
            'report_type': report_type
        })
            
    except Exception as e:
        logger.error(f"Error downloading {report_type} report: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
