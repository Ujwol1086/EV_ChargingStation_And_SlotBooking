from flask import Blueprint, jsonify, request, send_file
from services.reporting_service import ReportingService
from services.visualization_service import VisualizationService
from services.pdf_service import PDFService
from models.booking import Booking
from models.user_new import User
from middleware.admin_middleware import require_admin
import os
import tempfile
from datetime import datetime

reporting_bp = Blueprint('reporting', __name__)

@reporting_bp.route('/comprehensive', methods=['GET'])
@require_admin
def generate_comprehensive_report():
    """Generate comprehensive report using all algorithms"""
    try:
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        users_data = User.get_all_users()
        stations_data = []  # You'll need to implement this or get from your data source
        
        # Generate report
        report = ReportingService.generate_comprehensive_report(bookings_data, users_data, stations_data)
        
        if report:
            return jsonify({
                'success': True,
                'report': report
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate report'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/user-clustering', methods=['GET'])
@require_admin
def generate_user_clustering_report():
    """Generate user clustering report"""
    try:
        k = request.args.get('k', 3, type=int)
        
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        users_data = User.get_all_users()
        
        # Generate clustering report
        clusters = ReportingService._kmeans_user_clustering(bookings_data, users_data, k)
        
        if 'error' not in clusters:
            return jsonify({
                'success': True,
                'clusters': clusters
            })
        else:
            return jsonify({
                'success': False,
                'error': clusters['error']
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/user-hierarchy', methods=['GET'])
@require_admin
def generate_user_hierarchy_report():
    """Generate user hierarchy report"""
    try:
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        users_data = User.get_all_users()
        
        # Generate hierarchy report
        hierarchy = ReportingService._hierarchical_user_clustering(bookings_data, users_data)
        
        if 'error' not in hierarchy:
            return jsonify({
                'success': True,
                'hierarchy': hierarchy
            })
        else:
            return jsonify({
                'success': False,
                'error': hierarchy['error']
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/behavior-patterns', methods=['GET'])
@require_admin
def generate_behavior_patterns_report():
    """Generate behavior patterns report"""
    try:
        min_support = request.args.get('min_support', 0.1, type=float)
        min_confidence = request.args.get('min_confidence', 0.5, type=float)
        
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        stations_data = []  # You'll need to implement this or get from your data source
        
        # Generate behavior patterns report
        patterns = ReportingService._apriori_behavior_analysis(
            bookings_data, stations_data, min_support, min_confidence
        )
        
        if 'error' not in patterns:
            return jsonify({
                'success': True,
                'patterns': patterns
            })
        else:
            return jsonify({
                'success': False,
                'error': patterns['error']
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/statistics', methods=['GET'])
@require_admin
def generate_statistics_report():
    """Generate basic statistics report"""
    try:
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        users_data = User.get_all_users()
        stations_data = []  # You'll need to implement this or get from your data source
        
        # Generate statistics report
        stats = ReportingService._basic_statistical_analysis(bookings_data, users_data, stations_data)
        
        if 'error' not in stats:
            return jsonify({
                'success': True,
                'statistics': stats
            })
        else:
            return jsonify({
                'success': False,
                'error': stats['error']
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/insights', methods=['GET'])
@require_admin
def generate_insights_report():
    """Generate insights report"""
    try:
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        users_data = User.get_all_users()
        stations_data = []  # You'll need to implement this or get from your data source
        
        # Generate comprehensive report for insights
        report = ReportingService.generate_comprehensive_report(bookings_data, users_data, stations_data)
        
        if report and 'insights' in report:
            return jsonify({
                'success': True,
                'insights': report['insights']
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate insights'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# New visualization endpoints
@reporting_bp.route('/charts/usage-patterns', methods=['GET'])
@require_admin
def generate_usage_patterns_chart():
    """Generate usage patterns chart"""
    try:
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        stations_data = []  # You'll need to implement this or get from your data source
        
        # Generate chart
        chart_base64 = VisualizationService.generate_usage_patterns_chart(bookings_data, stations_data)
        
        if chart_base64:
            return jsonify({
                'success': True,
                'chart': chart_base64
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate chart'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/charts/user-clustering', methods=['GET'])
@require_admin
def generate_user_clustering_chart():
    """Generate user clustering chart"""
    try:
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        users_data = User.get_all_users()
        
        # Generate clustering report first
        clusters = ReportingService._kmeans_user_clustering(bookings_data, users_data)
        
        if 'error' not in clusters:
            # Generate chart
            chart_base64 = VisualizationService.generate_user_clustering_chart(clusters)
            
            if chart_base64:
                return jsonify({
                    'success': True,
                    'chart': chart_base64
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to generate chart'
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': clusters['error']
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/charts/behavior-patterns', methods=['GET'])
@require_admin
def generate_behavior_patterns_chart():
    """Generate behavior patterns chart"""
    try:
        min_support = request.args.get('min_support', 0.1, type=float)
        min_confidence = request.args.get('min_confidence', 0.5, type=float)
        
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        stations_data = []  # You'll need to implement this or get from your data source
        
        # Generate behavior patterns report first
        patterns = ReportingService._apriori_behavior_analysis(
            bookings_data, stations_data, min_support, min_confidence
        )
        
        if 'error' not in patterns:
            # Generate chart
            chart_base64 = VisualizationService.generate_behavior_patterns_chart(patterns)
            
            if chart_base64:
                return jsonify({
                    'success': True,
                    'chart': chart_base64
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to generate chart'
                }), 500
        else:
            return jsonify({
                'success': False,
                'error': patterns['error']
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/charts/dashboard', methods=['GET'])
@require_admin
def generate_comprehensive_dashboard():
    """Generate comprehensive dashboard with all charts"""
    try:
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        users_data = User.get_all_users()
        stations_data = []  # You'll need to implement this or get from your data source
        
        # Generate clustering and patterns reports
        user_clusters = ReportingService._kmeans_user_clustering(bookings_data, users_data)
        behavior_patterns = ReportingService._apriori_behavior_analysis(bookings_data, stations_data)
        
        # Generate comprehensive dashboard
        dashboard = VisualizationService.generate_comprehensive_dashboard(
            bookings_data, users_data, stations_data, user_clusters, behavior_patterns
        )
        
        if dashboard:
            return jsonify({
                'success': True,
                'dashboard': dashboard
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate dashboard'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# PDF generation endpoints
@reporting_bp.route('/pdf/comprehensive', methods=['GET'])
@require_admin
def generate_comprehensive_pdf():
    """Generate comprehensive PDF report"""
    try:
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        users_data = User.get_all_users()
        stations_data = []  # You'll need to implement this or get from your data source
        
        # Generate comprehensive report
        report = ReportingService.generate_comprehensive_report(bookings_data, users_data, stations_data)
        
        if not report:
            return jsonify({
                'success': False,
                'error': 'Failed to generate report data'
            }), 500
        
        # Generate charts for PDF
        user_clusters = ReportingService._kmeans_user_clustering(bookings_data, users_data)
        behavior_patterns = ReportingService._apriori_behavior_analysis(bookings_data, stations_data)
        
        charts = VisualizationService.generate_comprehensive_dashboard(
            bookings_data, users_data, stations_data, user_clusters, behavior_patterns
        )
        
        # Generate PDF
        filename = f"ev_charging_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        pdf_path = PDFService.generate_comprehensive_pdf_report(report, charts, filename)
        
        if pdf_path and os.path.exists(pdf_path):
            return send_file(
                pdf_path,
                as_attachment=True,
                download_name=filename,
                mimetype='application/pdf'
            )
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate PDF'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/pdf/executive-summary', methods=['GET'])
@require_admin
def generate_executive_summary_pdf():
    """Generate executive summary PDF"""
    try:
        # Get data from database
        bookings_data = Booking.get_all_bookings()
        users_data = User.get_all_users()
        stations_data = []  # You'll need to implement this or get from your data source
        
        # Generate comprehensive report
        report = ReportingService.generate_comprehensive_report(bookings_data, users_data, stations_data)
        
        if not report:
            return jsonify({
                'success': False,
                'error': 'Failed to generate report data'
            }), 500
        
        # Generate main chart for executive summary
        charts = VisualizationService.generate_usage_patterns_chart(bookings_data, stations_data)
        charts_data = {'usage_patterns': charts} if charts else {}
        
        # Generate PDF
        filename = f"executive_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        pdf_path = PDFService.generate_executive_summary_pdf(report, charts_data, filename)
        
        if pdf_path and os.path.exists(pdf_path):
            return send_file(
                pdf_path,
                as_attachment=True,
                download_name=filename,
                mimetype='application/pdf'
            )
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to generate PDF'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/export/<report_type>', methods=['GET'])
@require_admin
def export_report(report_type):
    """Export report in different formats"""
    try:
        if report_type not in ['comprehensive', 'executive-summary']:
            return jsonify({
                'success': False,
                'error': 'Invalid report type'
            }), 400
        
        # Redirect to appropriate PDF endpoint
        if report_type == 'comprehensive':
            return generate_comprehensive_pdf()
        else:
            return generate_executive_summary_pdf()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@reporting_bp.route('/download/<report_type>', methods=['GET'])
@require_admin
def download_report(report_type):
    """Download report file"""
    try:
        if report_type not in ['comprehensive', 'executive-summary']:
            return jsonify({
                'success': False,
                'error': 'Invalid report type'
            }), 400
        
        # This endpoint can be used for future file downloads
        return jsonify({
            'success': True,
            'message': f'Download endpoint for {report_type} report'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
