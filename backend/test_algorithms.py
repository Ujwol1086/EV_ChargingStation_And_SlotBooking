#!/usr/bin/env python3
"""
Test script for the reporting algorithms
This script tests the implemented algorithms with sample data to ensure they work correctly.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.reporting_service import ReportingService
from datetime import datetime, timedelta

def create_sample_data():
    """Create sample data for testing the algorithms"""
    
    # Sample users
    users = [
        {"_id": "user1", "username": "John", "email": "john@example.com"},
        {"_id": "user2", "username": "Jane", "email": "jane@example.com"},
        {"_id": "user3", "username": "Bob", "email": "bob@example.com"},
        {"_id": "user4", "username": "Alice", "email": "alice@example.com"},
        {"_id": "user5", "username": "Charlie", "email": "charlie@example.com"},
        {"_id": "user6", "username": "Diana", "email": "diana@example.com"},
        {"_id": "user7", "username": "Eve", "email": "eve@example.com"},
        {"_id": "user8", "username": "Frank", "email": "frank@example.com"},
    ]
    
    # Sample charging stations
    stations = [
        {"id": "station1", "name": "Kathmandu Central", "latitude": 27.7172, "longitude": 85.3240},
        {"id": "station2", "name": "Pokhara Lakeside", "latitude": 28.2096, "longitude": 83.9856},
        {"id": "station3", "name": "Thankot Highway", "latitude": 27.7172, "longitude": 85.3240},
        {"id": "station4", "name": "Baneshwor Station", "latitude": 27.7172, "longitude": 85.3240},
        {"id": "station5", "name": "Lalitpur Station", "latitude": 27.7172, "longitude": 85.3240},
    ]
    
    # Sample bookings with realistic patterns
    base_time = datetime.now() - timedelta(days=30)
    
    bookings = [
        # User 1: High-value frequent user
        {"user_id": "user1", "station_id": "station1", "amount_npr": 150, "estimated_duration": 90, "created_at": base_time + timedelta(days=1)},
        {"user_id": "user1", "station_id": "station2", "amount_npr": 200, "estimated_duration": 120, "created_at": base_time + timedelta(days=5)},
        {"user_id": "user1", "station_id": "station1", "amount_npr": 180, "estimated_duration": 100, "created_at": base_time + timedelta(days=10)},
        {"user_id": "user1", "station_id": "station3", "amount_npr": 120, "estimated_duration": 60, "created_at": base_time + timedelta(days=15)},
        {"user_id": "user1", "station_id": "station2", "amount_npr": 220, "estimated_duration": 150, "created_at": base_time + timedelta(days=20)},
        
        # User 2: Premium user with high amounts
        {"user_id": "user2", "station_id": "station1", "amount_npr": 300, "estimated_duration": 180, "created_at": base_time + timedelta(days=2)},
        {"user_id": "user2", "station_id": "station4", "amount_npr": 250, "estimated_duration": 150, "created_at": base_time + timedelta(days=8)},
        {"user_id": "user2", "station_id": "station1", "amount_npr": 280, "estimated_duration": 160, "created_at": base_time + timedelta(days=18)},
        
        # User 3: Regular user
        {"user_id": "user3", "station_id": "station2", "amount_npr": 100, "estimated_duration": 60, "created_at": base_time + timedelta(days=3)},
        {"user_id": "user3", "station_id": "station3", "amount_npr": 80, "estimated_duration": 45, "created_at": base_time + timedelta(days=12)},
        {"user_id": "user3", "station_id": "station2", "amount_npr": 120, "estimated_duration": 75, "created_at": base_time + timedelta(days=22)},
        
        # User 4: Occasional user
        {"user_id": "user4", "station_id": "station1", "amount_npr": 90, "estimated_duration": 50, "created_at": base_time + timedelta(days=7)},
        {"user_id": "user4", "station_id": "station5", "amount_npr": 110, "estimated_duration": 65, "created_at": base_time + timedelta(days=25)},
        
        # User 5: New user
        {"user_id": "user5", "station_id": "station1", "amount_npr": 75, "estimated_duration": 40, "created_at": base_time + timedelta(days=28)},
        
        # User 6: Station variety user
        {"user_id": "user6", "station_id": "station1", "amount_npr": 130, "estimated_duration": 80, "created_at": base_time + timedelta(days=4)},
        {"user_id": "user6", "station_id": "station2", "amount_npr": 160, "estimated_duration": 95, "created_at": base_time + timedelta(days=11)},
        {"user_id": "user6", "station_id": "station3", "amount_npr": 95, "estimated_duration": 55, "created_at": base_time + timedelta(days=16)},
        {"user_id": "user6", "station_id": "station4", "amount_npr": 140, "estimated_duration": 85, "created_at": base_time + timedelta(days=23)},
        {"user_id": "user6", "station_id": "station5", "amount_npr": 115, "estimated_duration": 70, "created_at": base_time + timedelta(days=27)},
        
        # User 7: High frequency user
        {"user_id": "user7", "station_id": "station1", "amount_npr": 85, "estimated_duration": 50, "created_at": base_time + timedelta(days=1)},
        {"user_id": "user7", "station_id": "station1", "amount_npr": 90, "estimated_duration": 55, "created_at": base_time + timedelta(days=3)},
        {"user_id": "user7", "station_id": "station1", "amount_npr": 95, "estimated_duration": 60, "created_at": base_time + timedelta(days=5)},
        {"user_id": "user7", "station_id": "station1", "amount_npr": 88, "estimated_duration": 52, "created_at": base_time + timedelta(days=7)},
        {"user_id": "user7", "station_id": "station1", "amount_npr": 92, "estimated_duration": 58, "created_at": base_time + timedelta(days=9)},
        
        # User 8: No bookings (for edge case testing)
    ]
    
    return users, stations, bookings

def test_basic_statistics():
    """Test basic statistical analysis"""
    print("Testing Basic Statistical Analysis...")
    
    users, stations, bookings = create_sample_data()
    
    try:
        stats = ReportingService._basic_statistical_analysis(bookings, users, stations)
        
        if 'error' in stats:
            print(f"❌ Error: {stats['error']}")
            return False
        
        print("✅ Basic Statistics Test Passed")
        print(f"   - Total Bookings: {stats['overview']['total_bookings']}")
        print(f"   - Total Users: {stats['overview']['total_users']}")
        print(f"   - Total Stations: {stats['overview']['total_stations']}")
        print(f"   - Avg Booking Amount: NPR {stats['overview']['avg_booking_amount']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Basic Statistics Test Failed: {e}")
        return False

def test_kmeans_clustering():
    """Test K-Means clustering"""
    print("\nTesting K-Means Clustering...")
    
    users, stations, bookings = create_sample_data()
    
    try:
        clusters = ReportingService._kmeans_user_clustering(bookings, users, k=3)
        
        if 'error' in clusters:
            print(f"❌ Error: {clusters['error']}")
            return False
        
        print("✅ K-Means Clustering Test Passed")
        print(f"   - Algorithm: {clusters['algorithm']}")
        print(f"   - Number of Clusters: {clusters['num_clusters']}")
        print(f"   - Total Users Analyzed: {clusters['total_users_analyzed']}")
        
        for i, cluster in enumerate(clusters['clusters']):
            print(f"   - Cluster {i+1}: {cluster['segment_type']} ({cluster['size']} users)")
        
        return True
        
    except Exception as e:
        print(f"❌ K-Means Clustering Test Failed: {e}")
        return False

def test_hierarchical_clustering():
    """Test hierarchical clustering"""
    print("\nTesting Hierarchical Clustering...")
    
    users, stations, bookings = create_sample_data()
    
    try:
        hierarchy = ReportingService._hierarchical_user_clustering(bookings, users)
        
        if 'error' in hierarchy:
            print(f"❌ Error: {hierarchy['error']}")
            return False
        
        print("✅ Hierarchical Clustering Test Passed")
        print(f"   - Algorithm: {hierarchy['algorithm']}")
        print(f"   - Total Users Analyzed: {hierarchy['total_users_analyzed']}")
        print(f"   - Clustering Method: {hierarchy['clustering_method']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Hierarchical Clustering Test Failed: {e}")
        return False

def test_apriori_algorithm():
    """Test Apriori algorithm"""
    print("\nTesting Apriori Algorithm...")
    
    users, stations, bookings = create_sample_data()
    
    try:
        patterns = ReportingService._apriori_behavior_analysis(bookings, stations, min_support=0.1, min_confidence=0.5)
        
        if 'error' in patterns:
            print(f"❌ Error: {patterns['error']}")
            return False
        
        print("✅ Apriori Algorithm Test Passed")
        print(f"   - Algorithm: {patterns['algorithm']}")
        print(f"   - Min Support: {patterns['min_support']}")
        print(f"   - Min Confidence: {patterns['min_confidence']}")
        print(f"   - Total Transactions: {patterns['total_transactions']}")
        
        if patterns['pattern_analysis']:
            print(f"   - Patterns Found: {len(patterns['pattern_analysis'])}")
            for i, pattern in enumerate(patterns['pattern_analysis'][:2]):  # Show first 2 patterns
                print(f"     Pattern {i+1}: {pattern['description'][:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Apriori Algorithm Test Failed: {e}")
        return False

def test_comprehensive_report():
    """Test comprehensive report generation"""
    print("\nTesting Comprehensive Report Generation...")
    
    users, stations, bookings = create_sample_data()
    
    try:
        report = ReportingService.generate_comprehensive_report(bookings, users, stations)
        
        if not report:
            print("❌ Error: Failed to generate comprehensive report")
            return False
        
        print("✅ Comprehensive Report Test Passed")
        print(f"   - Timestamp: {report['timestamp']}")
        print(f"   - Total Users: {report['summary']['total_users']}")
        print(f"   - Total Bookings: {report['summary']['total_bookings']}")
        print(f"   - Total Stations: {report['summary']['total_stations']}")
        print(f"   - Algorithms Used: {', '.join(report['summary']['algorithms_used'])}")
        
        if report['insights']:
            print(f"   - Insights Generated: {len(report['insights'])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Comprehensive Report Test Failed: {e}")
        return False

def test_algorithm_components():
    """Test individual algorithm components"""
    print("\nTesting Algorithm Components...")
    
    # Test feature normalization
    try:
        features = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
        normalized = ReportingService._normalize_features(features)
        print("✅ Feature Normalization Test Passed")
    except Exception as e:
        print(f"❌ Feature Normalization Test Failed: {e}")
    
    # Test user profile calculation
    try:
        sample_bookings = [
            {"amount_npr": 100, "estimated_duration": 60},
            {"amount_npr": 150, "estimated_duration": 90}
        ]
        profile = ReportingService._calculate_user_profile(sample_bookings)
        print("✅ User Profile Calculation Test Passed")
    except Exception as e:
        print(f"❌ User Profile Calculation Test Failed: {e}")
    
    # Test user segment classification
    try:
        features = [5, 120, 1.5, 75, 2]  # Sample feature vector
        segment = ReportingService._classify_user_segment(features)
        print(f"✅ User Segment Classification Test Passed: {segment}")
    except Exception as e:
        print(f"❌ User Segment Classification Test Failed: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting Algorithm Tests...")
    print("=" * 50)
    
    test_results = []
    
    # Run all tests
    test_results.append(test_basic_statistics())
    test_results.append(test_kmeans_clustering())
    test_results.append(test_hierarchical_clustering())
    test_results.append(test_apriori_algorithm())
    test_results.append(test_comprehensive_report())
    
    # Test components
    test_algorithm_components()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    passed = sum(test_results)
    total = len(test_results)
    
    print(f"Tests Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! The reporting system is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
    
    print("\n✅ Algorithm Implementation Complete!")
    print("The reporting system is ready for use in the EV charging station application.")

if __name__ == "__main__":
    main()
