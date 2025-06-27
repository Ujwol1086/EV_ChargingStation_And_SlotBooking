#!/usr/bin/env python3
"""
Comprehensive Test Suite for Enhanced EV Charging System
Tests the Hybrid Algorithm with context-aware parameters and API endpoints
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test if all required modules can be imported"""
    print("🔍 Testing imports...")
    
    try:
        from services.Hybrid_Algorithm import HybridAlgorithm
        print("✅ HybridAlgorithm imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import HybridAlgorithm: {e}")
        return False
    
    try:
        from models.charging_station import ChargingStation
        print("✅ ChargingStation model imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import ChargingStation: {e}")
        return False
    
    return True

def test_charging_stations():
    """Test loading and accessing charging stations"""
    print("\n🏢 Testing charging station data...")
    
    try:
        from models.charging_station import ChargingStation
        stations = ChargingStation.get_all()
        
        if not stations:
            print("❌ No charging stations found")
            return False
        
        print(f"✅ Loaded {len(stations)} charging stations")
        
        # Test first station
        first_station = stations[0]
        print(f"📍 First station: {first_station.get('name', 'Unknown')}")
        print(f"   Location: {first_station.get('location', {}).get('address', 'Unknown')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading charging stations: {e}")
        return False

def test_basic_algorithm():
    """Test basic algorithm functionality"""
    print("\n🧠 Testing basic algorithm functionality...")
    
    try:
        from services.Hybrid_Algorithm import HybridAlgorithm
        from models.charging_station import ChargingStation
        
        # Get stations data
        stations = ChargingStation.get_all()
        if not stations:
            print("❌ No stations available for testing")
            return False
        
        # Initialize algorithm
        algorithm = HybridAlgorithm()
        print("✅ Algorithm initialized successfully")
        
        # Test basic recommendation
        test_location = [27.7172, 85.324]  # Kathmandu
        basic_recommendations = algorithm.get_recommendations(test_location, stations)
        
        if basic_recommendations and len(basic_recommendations) > 0:
            print(f"✅ Basic recommendations returned {len(basic_recommendations)} stations")
            return True
        else:
            print("❌ Basic recommendations returned empty results")
            return False
            
    except Exception as e:
        print(f"❌ Error testing basic algorithm: {e}")
        return False

def test_enhanced_algorithm():
    """Test enhanced algorithm with context-aware parameters"""
    print("\n🎯 Testing enhanced algorithm with context-aware parameters...")
    
    try:
        from services.Hybrid_Algorithm import HybridAlgorithm
        from models.charging_station import ChargingStation
        
        # Get stations data
        stations = ChargingStation.get_all()
        if not stations:
            print("❌ No stations available for testing")
            return False
        
        algorithm = HybridAlgorithm()
        
        # Test enhanced recommendations with context
        user_location = [27.7172, 85.324]  # Kathmandu
        user_context = {
            'battery_percentage': 25.0,
            'urgency': 'high',
            'plug_type': 'CCS',
            'ac_status': True,
            'passengers': 3,
            'terrain': 'hilly'
        }
        
        print(f"🔧 Testing with context: {user_context}")
        
        enhanced_recommendations = algorithm.get_enhanced_recommendations(user_location, stations, user_context)
        
        if not enhanced_recommendations:
            print("❌ Enhanced recommendations returned None")
            return False
        
        recommendations = enhanced_recommendations.get('recommendations', [])
        algorithm_info = enhanced_recommendations.get('algorithm_info', {})
        
        print(f"✅ Enhanced recommendations returned {len(recommendations)} stations")
        print(f"📊 Algorithm: {algorithm_info.get('algorithm_used', 'Unknown')}")
        print(f"⏱️  Processing time: {algorithm_info.get('processing_time_ms', 0):.2f}ms")
        
        # Test first recommendation details
        if recommendations:
            first = recommendations[0]
            print(f"\n🏆 Top recommendation: {first.get('name', 'Unknown')}")
            print(f"   Score: {first.get('score', 0):.3f}")
            print(f"   Distance: {first.get('distance', 0):.2f} km")
            
            # Check for energy analysis
            energy_analysis = first.get('energy_analysis', {})
            if energy_analysis:
                print(f"   Energy needed: {energy_analysis.get('total_consumption_kwh', 0):.2f} kWh")
                print(f"   Reachable: {'✅' if energy_analysis.get('is_reachable') else '❌'}")
                print(f"   Efficiency: {energy_analysis.get('energy_efficiency_score', 0):.2f}")
            
            # Check for score breakdown
            score_breakdown = first.get('score_breakdown', {})
            if score_breakdown:
                print("   Score breakdown:")
                for factor, score in score_breakdown.items():
                    print(f"     {factor}: {score:.3f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing enhanced algorithm: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_energy_calculations():
    """Test energy consumption calculations"""
    print("\n⚡ Testing energy consumption calculations...")
    
    try:
        from services.Hybrid_Algorithm import HybridAlgorithm
        
        algorithm = HybridAlgorithm()
        
        # Test different scenarios
        scenarios = [
            {
                'name': 'City driving, no AC, 1 passenger',
                'distance': 10.0,
                'terrain': 'flat',
                'ac_status': False,
                'passengers': 1,
                'battery_percentage': 80
            },
            {
                'name': 'Highway driving, AC on, 4 passengers',
                'distance': 50.0,
                'terrain': 'flat',
                'ac_status': True,
                'passengers': 4,
                'battery_percentage': 60
            },
            {
                'name': 'Mountain driving, AC on, 2 passengers',
                'distance': 30.0,
                'terrain': 'steep',
                'ac_status': True,
                'passengers': 2,
                'battery_percentage': 40
            }
        ]
        
        for scenario in scenarios:
            energy = algorithm.calculate_energy_consumption(
                scenario['distance'],
                scenario['ac_status'],
                scenario['passengers'],
                scenario['terrain'],
                scenario['battery_percentage']
            )
            print(f"📊 {scenario['name']}: {energy['total_consumption_kwh']:.2f} kWh")
            print(f"   Reachable: {'✅' if energy['is_reachable'] else '❌'}")
        
        print("✅ Energy calculations completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error testing energy calculations: {e}")
        return False

def test_different_contexts():
    """Test algorithm with different user contexts"""
    print("\n🎭 Testing different user contexts...")
    
    try:
        from services.Hybrid_Algorithm import HybridAlgorithm
        from models.charging_station import ChargingStation
        
        # Get stations data
        stations = ChargingStation.get_all()
        if not stations:
            print("❌ No stations available for testing")
            return False
        
        algorithm = HybridAlgorithm()
        
        contexts = [
            {
                'name': 'Emergency low battery',
                'location': [27.7172, 85.324],
                'context': {
                    'battery_percentage': 5.0,
                    'urgency': 'emergency',
                    'plug_type': 'CCS',
                    'ac_status': False,
                    'passengers': 1,
                    'terrain': 'flat'
                }
            },
            {
                'name': 'Planned trip with family',
                'location': [27.7172, 85.324],
                'context': {
                    'battery_percentage': 60.0,
                    'urgency': 'low',
                    'plug_type': 'Type2',
                    'ac_status': True,
                    'passengers': 4,
                    'terrain': 'hilly'
                }
            },
            {
                'name': 'Business trip',
                'location': [27.7172, 85.324],
                'context': {
                    'battery_percentage': 30.0,
                    'urgency': 'medium',
                    'plug_type': 'CHAdeMO',
                    'ac_status': True,
                    'passengers': 1,
                    'terrain': 'flat'
                }
            }
        ]
        
        for test_case in contexts:
            print(f"\n🧪 Testing: {test_case['name']}")
            
            result = algorithm.get_enhanced_recommendations(
                test_case['location'], 
                stations, 
                test_case['context']
            )
            
            if result and result.get('recommendations'):
                recommendations = result['recommendations']
                print(f"   ✅ Got {len(recommendations)} recommendations")
                
                if recommendations:
                    top = recommendations[0]
                    print(f"   🏆 Top choice: {top.get('name', 'Unknown')}")
                    print(f"   📊 Score: {top.get('score', 0):.3f}")
                    
                    energy = top.get('energy_analysis', {})
                    if energy:
                        reachable = "✅ Reachable" if energy.get('is_reachable') else "❌ Not reachable"
                        print(f"   ⚡ {reachable} ({energy.get('total_consumption_kwh', 0):.1f} kWh needed)")
            else:
                print("   ❌ No recommendations returned")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing different contexts: {e}")
        return False

def test_api_format():
    """Test API response format compatibility"""
    print("\n🌐 Testing API response format...")
    
    try:
        from services.Hybrid_Algorithm import HybridAlgorithm
        from models.charging_station import ChargingStation
        
        # Get stations data
        stations = ChargingStation.get_all()
        if not stations:
            print("❌ No stations available for testing")
            return False
        
        algorithm = HybridAlgorithm()
        
        # Test basic API format
        basic_result = algorithm.get_recommendations(
            [27.7172, 85.324],  # Kathmandu
            stations,
            {
                'battery_level': 40.0,
                'urgency': 'medium',
                'plug_type': 'CCS'
            }
        )
        
        if basic_result and len(basic_result) > 0:
            print("✅ Basic API format working")
            print(f"   📊 Returned {len(basic_result)} recommendations")
        else:
            print("❌ Basic API format failed")
            return False
        
        # Test enhanced API format
        enhanced_result = algorithm.get_enhanced_recommendations(
            [27.7172, 85.324],
            stations,
            {
                'battery_percentage': 40.0,
                'urgency': 'medium',
                'plug_type': 'CCS',
                'ac_status': True,
                'passengers': 2,
                'terrain': 'hilly'
            }
        )
        
        if enhanced_result and enhanced_result.get('recommendations'):
            print("✅ Enhanced API format working")
            print(f"   📊 Returned {len(enhanced_result['recommendations'])} recommendations")
        else:
            print("❌ Enhanced API format failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing API formats: {e}")
        return False

def run_all_tests():
    """Run all tests and provide summary"""
    print("🚀 Starting Enhanced EV Charging System Test Suite")
    print("=" * 60)
    
    tests = [
        ("Import Tests", test_imports),
        ("Charging Station Data", test_charging_stations),
        ("Basic Algorithm", test_basic_algorithm),
        ("Enhanced Algorithm", test_enhanced_algorithm),
        ("Energy Calculations", test_energy_calculations),
        ("Different Contexts", test_different_contexts),
        ("API Format Compatibility", test_api_format)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Enhanced system is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the output above.")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1) 