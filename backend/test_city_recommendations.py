#!/usr/bin/env python3
"""
Test script for city-based destination filtering in EV Charging Station Recommendations
"""

import sys
import os
import json
import time

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.Hybrid_Algorithm import HybridAlgorithm
from models.charging_station import ChargingStation

def test_city_coordinates():
    """Test if city coordinates are properly loaded"""
    print("🗺️ Testing City Coordinates...")
    
    algorithm = HybridAlgorithm()
    
    print(f"Total cities available: {len(algorithm.city_coords)}")
    print("Available cities:")
    for city, coords in algorithm.city_coords.items():
        print(f"  - {city}: {coords}")
    
    # Test coordinate retrieval
    test_city = "Kathmandu"
    coords = algorithm.get_city_coordinates(test_city)
    if coords:
        print(f"✅ {test_city} coordinates: {coords}")
    else:
        print(f"❌ Failed to get coordinates for {test_city}")
    
    print("-" * 50)

def test_route_filtering():
    """Test route-based station filtering"""
    print("🛣️ Testing Route-Based Station Filtering...")
    
    try:
        # Get all stations
        stations = ChargingStation.get_all()
        print(f"Loaded {len(stations)} stations")
        
        # Test parameters
        user_location = [27.7172, 85.3240]  # Kathmandu center
        destination_city = "Pokhara"
        max_detour_km = 20
        
        # Create user context
        user_context = {
            'battery_percentage': 60,
            'urgency': 'medium',
            'ac_status': True,
            'passengers': 2,
            'terrain': 'hilly',
            'destination_city': destination_city,
            'max_detour_km': max_detour_km,
            'route_mode': True
        }
        
        # Initialize algorithm
        algorithm = HybridAlgorithm()
        
        print(f"Testing route from {user_location} to {destination_city}")
        print(f"Max detour: {max_detour_km} km")
        
        # Get recommendations
        result = algorithm.get_enhanced_recommendations(
            user_location=user_location,
            stations=stations,
            user_context=user_context,
            max_recommendations=5
        )
        
        if isinstance(result, dict) and 'recommendations' in result:
            recommendations = result['recommendations']
            algorithm_info = result['algorithm_info']
        else:
            recommendations = result
            algorithm_info = {}
        
        print(f"Generated {len(recommendations)} route-based recommendations")
        
        if recommendations:
            print("\nTop recommendations:")
            for i, rec in enumerate(recommendations[:3], 1):
                print(f"{i}. {rec['name']}")
                print(f"   Distance: {rec['distance']} km")
                print(f"   Score: {rec['score']:.3f}")
                if 'along_route' in rec:
                    print(f"   Along route: {'Yes' if rec['along_route'] else 'No'}")
                if 'detour_distance' in rec:
                    print(f"   Detour: {rec['detour_distance']:.1f} km")
                print()
        
        print(f"Algorithm info: {algorithm_info}")
        print("✅ Route filtering test completed")
        
    except Exception as e:
        print(f"❌ Route filtering test failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("-" * 50)

def test_api_endpoints():
    """Test the API endpoints for city-based recommendations"""
    print("🌐 Testing API Endpoints...")
    
    base_url = "http://localhost:5000/api/recommendations"
    
    # Test 1: Get supported cities
    try:
        response = requests.get(f"{base_url}/cities", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Cities endpoint: {data['total_cities']} cities available")
            for city in data['cities'][:3]:
                print(f"   - {city['name']}: {city['coordinates']}")
            if len(data['cities']) > 3:
                print(f"   ... and {len(data['cities']) - 3} more cities")
        else:
            print(f"❌ Cities endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Cities endpoint error: {e}")
    
    # Test 2: Route-based recommendations
    try:
        test_data = {
            "location": [27.7172, 85.3240],  # Kathmandu
            "destination_city": "Pokhara",
            "battery_percentage": 50,
            "urgency_level": "medium",
            "ac_status": True,
            "passengers": 2,
            "terrain": "hilly",
            "max_detour_km": 25
        }
        
        print(f"\nTesting route recommendations: {test_data['location']} → {test_data['destination_city']}")
        
        response = requests.post(f"{base_url}/route-to-city", json=test_data, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Route recommendations API working")
            print(f"   Route info: {data['route_info']['direct_distance_km']} km direct distance")
            print(f"   Recommendations: {len(data['recommendations'])}")
            
            if data['recommendations']:
                top_rec = data['recommendations'][0]
                print(f"   Top choice: {top_rec['name']} (Score: {top_rec['score']:.3f})")
        else:
            print(f"❌ Route recommendations failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Route recommendations error: {e}")
    
    print("-" * 50)

def test_enhanced_vs_route_mode():
    """Compare enhanced recommendations vs route-based recommendations"""
    print("⚖️ Comparing Enhanced vs Route-Based Recommendations...")
    
    try:
        stations = ChargingStation.get_all()
        algorithm = HybridAlgorithm()
        
        user_location = [27.7172, 85.3240]  # Kathmandu
        
        # Enhanced recommendations (normal mode)
        enhanced_context = {
            'battery_percentage': 50,
            'urgency': 'medium',
            'ac_status': True,
            'passengers': 2,
            'terrain': 'hilly'
        }
        
        enhanced_result = algorithm.get_enhanced_recommendations(
            user_location=user_location,
            stations=stations,
            user_context=enhanced_context,
            max_recommendations=3
        )
        
        # Route-based recommendations
        route_context = {
            'battery_percentage': 50,
            'urgency': 'medium',
            'ac_status': True,
            'passengers': 2,
            'terrain': 'hilly',
            'destination_city': 'Pokhara',
            'max_detour_km': 20,
            'route_mode': True
        }
        
        route_result = algorithm.get_enhanced_recommendations(
            user_location=user_location,
            stations=stations,
            user_context=route_context,
            max_recommendations=3
        )
        
        # Extract recommendations
        enhanced_recs = enhanced_result['recommendations'] if isinstance(enhanced_result, dict) else enhanced_result
        route_recs = route_result['recommendations'] if isinstance(route_result, dict) else route_result
        
        print("Enhanced Recommendations (Normal Mode):")
        for i, rec in enumerate(enhanced_recs[:3], 1):
            print(f"  {i}. {rec['name']} - Score: {rec['score']:.3f}, Distance: {rec['distance']} km")
        
        print("\nRoute-Based Recommendations (To Pokhara):")
        for i, rec in enumerate(route_recs[:3], 1):
            print(f"  {i}. {rec['name']} - Score: {rec['score']:.3f}, Distance: {rec['distance']} km")
            if 'along_route' in rec:
                print(f"     Along route: {'Yes' if rec['along_route'] else 'No'}")
        
        # Check if results are different
        enhanced_names = [r['name'] for r in enhanced_recs[:3]]
        route_names = [r['name'] for r in route_recs[:3]]
        
        if enhanced_names != route_names:
            print("\n✅ Route-based filtering is working - different recommendations generated")
        else:
            print("\n⚠️ Same recommendations in both modes - may need to check route filtering logic")
        
    except Exception as e:
        print(f"❌ Comparison test failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("-" * 50)

def main():
    """Run all tests"""
    print("🚀 Starting City-Based Destination Filtering Tests")
    print("=" * 60)
    
    # Run core algorithm tests
    test_city_coordinates()
    test_route_filtering()
    test_enhanced_vs_route_mode()
    
    print("⚠️ API tests skipped - run with server for full testing")
    print("   (Start server with 'python app.py' to test API endpoints)")
    
    print("=" * 60)
    print("🏁 City-Based Destination Filtering Tests Completed")

if __name__ == "__main__":
    main() 