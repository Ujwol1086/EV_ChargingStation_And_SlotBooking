from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
import io
import base64
from datetime import datetime

class PDFService:
    """Service class for generating PDF reports"""
    
    @staticmethod
    def generate_comprehensive_pdf_report(report_data, charts_data, filename="ev_charging_report.pdf"):
        """Generate comprehensive PDF report with charts and analysis"""
        try:
            # Create PDF document
            doc = SimpleDocTemplate(filename, pagesize=A4)
            story = []
            
            # Get styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.darkblue
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=16,
                spaceAfter=12,
                spaceBefore=20,
                textColor=colors.darkblue
            )
            
            subheading_style = ParagraphStyle(
                'CustomSubHeading',
                parent=styles['Heading3'],
                fontSize=14,
                spaceAfter=8,
                spaceBefore=15,
                textColor=colors.darkgreen
            )
            
            normal_style = styles['Normal']
            
            # Title page
            story.append(Paragraph("EV Charging Station Analytics Report", title_style))
            story.append(Spacer(1, 20))
            
            # Report metadata
            metadata_data = [
                ['Report Generated:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
                ['Total Users:', str(report_data['summary']['total_users'])],
                ['Total Bookings:', str(report_data['summary']['total_bookings'])],
                ['Total Stations:', str(report_data['summary']['total_stations'])],
                ['Analysis Period:', report_data['summary']['analysis_period']]
            ]
            
            metadata_table = Table(metadata_data, colWidths=[2*inch, 3*inch])
            metadata_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('BACKGROUND', (0, 0), (0, -1), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ]))
            
            story.append(metadata_table)
            story.append(PageBreak())
            
            # Executive Summary
            story.append(Paragraph("Executive Summary", heading_style))
            story.append(Paragraph(
                "This comprehensive report provides detailed analysis of EV charging station usage patterns, "
                "user behavior segmentation, and business insights derived from advanced analytics algorithms. "
                "The analysis covers K-Means clustering, hierarchical clustering, and Apriori pattern mining.",
                normal_style
            ))
            story.append(Spacer(1, 12))
            
            # Key Insights
            if 'insights' in report_data:
                story.append(Paragraph("Key Business Insights", subheading_style))
                for insight in report_data['insights']:
                    story.append(Paragraph(f"• {insight}", normal_style))
                story.append(Spacer(1, 12))
            
            # Basic Statistics Section
            if 'basic_statistics' in report_data:
                story.append(Paragraph("Basic Statistics Overview", heading_style))
                
                basic_stats = report_data['basic_statistics']
                if 'overview' in basic_stats:
                    overview_data = [
                        ['Metric', 'Value'],
                        ['Total Bookings', str(basic_stats['overview']['total_bookings'])],
                        ['Total Users', str(basic_stats['overview']['total_users'])],
                        ['Total Stations', str(basic_stats['overview']['total_stations'])],
                        ['Average Booking Amount', f"₹{basic_stats['overview']['avg_booking_amount']}"]
                    ]
                    
                    overview_table = Table(overview_data, colWidths=[2.5*inch, 2.5*inch])
                    overview_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 12),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                    ]))
                    
                    story.append(overview_table)
                    story.append(Spacer(1, 12))
                
                # Growth Metrics
                if 'growth_metrics' in basic_stats:
                    story.append(Paragraph("Growth Metrics", subheading_style))
                    growth_data = [
                        ['Metric', 'Value'],
                        ['Recent Bookings (30 days)', str(basic_stats['growth_metrics']['recent_bookings_30d'])],
                        ['Average Bookings per User', str(basic_stats['growth_metrics']['avg_bookings_per_user'])]
                    ]
                    
                    growth_table = Table(growth_data, colWidths=[2.5*inch, 2.5*inch])
                    growth_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 12),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
                    ]))
                    
                    story.append(growth_table)
                    story.append(Spacer(1, 12))
            
            # User Clustering Section
            if 'user_clustering' in report_data:
                story.append(Paragraph("User Behavior Segmentation", heading_style))
                
                user_clusters = report_data['user_clustering']
                if 'clusters' in user_clusters:
                    story.append(Paragraph(
                        f"Analysis using K-Means clustering with {user_clusters['num_clusters']} clusters. "
                        f"Total users analyzed: {user_clusters['total_users_analyzed']}",
                        normal_style
                    ))
                    story.append(Spacer(1, 12))
                    
                    # Cluster details table
                    cluster_headers = ['Cluster', 'Size', 'Segment Type', 'Avg Bookings', 'Avg Amount']
                    cluster_data = [cluster_headers]
                    
                    for cluster in user_clusters['clusters']:
                        characteristics = cluster['characteristics']
                        cluster_data.append([
                            f"Cluster {cluster['cluster_id']+1}",
                            str(cluster['size']),
                            cluster['segment_type'],
                            f"{characteristics['avg_total_bookings']:.1f}",
                            f"₹{characteristics['avg_amount']:.0f}"
                        ])
                    
                    cluster_table = Table(cluster_data, colWidths=[1*inch, 0.8*inch, 1.5*inch, 1*inch, 1*inch])
                    cluster_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                        ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ]))
                    
                    story.append(cluster_table)
                    story.append(Spacer(1, 12))
            
            # Behavior Patterns Section
            if 'behavior_patterns' in report_data:
                story.append(Paragraph("Behavior Pattern Analysis", heading_style))
                
                behavior_patterns = report_data['behavior_patterns']
                if 'pattern_analysis' in behavior_patterns:
                    story.append(Paragraph(
                        f"Analysis using Apriori algorithm with {behavior_patterns['total_transactions']} transactions. "
                        f"Patterns discovered: {len(behavior_patterns['pattern_analysis'])}",
                        normal_style
                    ))
                    story.append(Spacer(1, 12))
                    
                    # Top patterns table
                    if behavior_patterns['pattern_analysis']:
                        pattern_headers = ['Pattern', 'Confidence', 'Support', 'Business Implication']
                        pattern_data = [pattern_headers]
                        
                        # Show top 5 patterns
                        top_patterns = sorted(
                            behavior_patterns['pattern_analysis'], 
                            key=lambda x: x['confidence'], 
                            reverse=True
                        )[:5]
                        
                        for pattern in top_patterns:
                            pattern_data.append([
                                pattern['description'][:50] + "..." if len(pattern['description']) > 50 else pattern['description'],
                                f"{pattern['confidence']:.3f}",
                                f"{pattern['support']:.3f}",
                                pattern['business_implication'][:40] + "..." if len(pattern['business_implication']) > 40 else pattern['business_implication']
                            ])
                        
                        pattern_table = Table(pattern_data, colWidths=[2*inch, 0.8*inch, 0.8*inch, 2*inch])
                        pattern_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, 0), 10),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                            ('GRID', (0, 0), (-1, -1), 1, colors.black),
                            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
                            ('FONTSIZE', (0, 1), (-1, -1), 8),
                            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ]))
                        
                        story.append(pattern_table)
                        story.append(Spacer(1, 12))
            
            # Add charts if available
            if charts_data:
                story.append(Paragraph("Data Visualizations", heading_style))
                story.append(Paragraph(
                    "The following charts provide visual representation of the analyzed data patterns.",
                    normal_style
                ))
                story.append(Spacer(1, 12))
                
                # Usage Patterns Chart
                if charts_data.get('usage_patterns'):
                    story.append(Paragraph("Usage Patterns Analysis", subheading_style))
                    try:
                        # Decode base64 image and add to PDF
                        img_data = base64.b64decode(charts_data['usage_patterns'])
                        img_buffer = io.BytesIO(img_data)
                        img = Image(img_buffer, width=6*inch, height=4*inch)
                        story.append(img)
                        story.append(Spacer(1, 12))
                    except Exception as e:
                        story.append(Paragraph(f"Chart could not be displayed: {str(e)}", normal_style))
                
                # User Clustering Chart
                if charts_data.get('user_clustering'):
                    story.append(Paragraph("User Clustering Analysis", subheading_style))
                    try:
                        img_data = base64.b64decode(charts_data['user_clustering'])
                        img_buffer = io.BytesIO(img_data)
                        img = Image(img_buffer, width=6*inch, height=4*inch)
                        story.append(img)
                        story.append(Spacer(1, 12))
                    except Exception as e:
                        story.append(Paragraph(f"Chart could not be displayed: {str(e)}", normal_style))
                
                # Behavior Patterns Chart
                if charts_data.get('behavior_patterns'):
                    story.append(Paragraph("Behavior Pattern Analysis", subheading_style))
                    try:
                        img_data = base64.b64decode(charts_data['behavior_patterns'])
                        img_buffer = io.BytesIO(img_data)
                        img = Image(img_buffer, width=6*inch, height=4*inch)
                        story.append(img)
                        story.append(Spacer(1, 12))
                    except Exception as e:
                        story.append(Paragraph(f"Chart could not be displayed: {str(e)}", normal_style))
            
            # Recommendations Section
            story.append(Paragraph("Strategic Recommendations", heading_style))
            story.append(Paragraph(
                "Based on the comprehensive analysis, the following strategic recommendations are provided:",
                normal_style
            ))
            story.append(Spacer(1, 12))
            
            recommendations = [
                "1. **Station Optimization**: Focus on high-utilization stations and optimize low-performing locations",
                "2. **User Engagement**: Implement targeted marketing campaigns based on user segments",
                "3. **Cross-selling Opportunities**: Leverage discovered behavior patterns for promotional strategies",
                "4. **Capacity Planning**: Use growth trends for infrastructure planning and expansion",
                "5. **Customer Retention**: Develop loyalty programs for high-value frequent users"
            ]
            
            for rec in recommendations:
                story.append(Paragraph(rec, normal_style))
                story.append(Spacer(1, 6))
            
            # Footer
            story.append(Spacer(1, 20))
            story.append(Paragraph(
                f"Report generated on {datetime.now().strftime('%Y-%m-%d at %H:%M:%S')}",
                ParagraphStyle('Footer', parent=normal_style, fontSize=10, alignment=TA_CENTER)
            ))
            
            # Build PDF
            doc.build(story)
            return filename
            
        except Exception as e:
            print(f"Error generating PDF report: {e}")
            return None
    
    @staticmethod
    def generate_executive_summary_pdf(report_data, charts_data, filename="executive_summary.pdf"):
        """Generate a concise executive summary PDF"""
        try:
            doc = SimpleDocTemplate(filename, pagesize=A4)
            story = []
            
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'ExecutiveTitle',
                parent=styles['Heading1'],
                fontSize=20,
                spaceAfter=20,
                alignment=TA_CENTER,
                textColor=colors.darkblue
            )
            
            heading_style = ParagraphStyle(
                'ExecutiveHeading',
                parent=styles['Heading2'],
                fontSize=14,
                spaceAfter=10,
                spaceBefore=15,
                textColor=colors.darkblue
            )
            
            normal_style = styles['Normal']
            
            # Title
            story.append(Paragraph("EV Charging Station - Executive Summary", title_style))
            story.append(Spacer(1, 20))
            
            # Key Metrics
            story.append(Paragraph("Key Performance Indicators", heading_style))
            
            kpi_data = [
                ['Metric', 'Value', 'Status'],
                ['Total Bookings', str(report_data['summary']['total_bookings']), '📊'],
                ['Total Users', str(report_data['summary']['total_users']), '👥'],
                ['Total Stations', str(report_data['summary']['total_stations']), '⚡'],
                ['Analysis Period', report_data['summary']['analysis_period'], '📅']
            ]
            
            kpi_table = Table(kpi_data, colWidths=[2*inch, 2*inch, 0.5*inch])
            kpi_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ]))
            
            story.append(kpi_table)
            story.append(Spacer(1, 15))
            
            # Top Insights
            if 'insights' in report_data:
                story.append(Paragraph("Top Business Insights", heading_style))
                for i, insight in enumerate(report_data['insights'][:5], 1):
                    story.append(Paragraph(f"{i}. {insight}", normal_style))
                    story.append(Spacer(1, 6))
            
            # Main Chart
            if charts_data.get('usage_patterns'):
                story.append(Paragraph("Usage Patterns Overview", heading_style))
                try:
                    img_data = base64.b64decode(charts_data['usage_patterns'])
                    img_buffer = io.BytesIO(img_data)
                    img = Image(img_buffer, width=5*inch, height=3*inch)
                    story.append(img)
                except Exception as e:
                    story.append(Paragraph("Chart could not be displayed", normal_style))
            
            # Build PDF
            doc.build(story)
            return filename
            
        except Exception as e:
            print(f"Error generating executive summary PDF: {e}")
            return None
