#!/usr/bin/env python3
"""
Script to check if charging stations are properly stored and accessible
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from models.charging_station import ChargingStation
    from services.Hybrid_Algorithm import HybridAlgorithm
    
    print("🔍 Checking charging stations...")
    
    # Get all stations
    stations = ChargingStation.get_all()
    print(f"📊 Total stations loaded: {len(stations)}")
    
    if not stations:
        print("❌ No stations found!")
        sys.exit(1)
    
    # Check a few stations
    print("\n📋 Sample stations:")
    for i, station in enumerate(stations[:5]):
        print(f"  {i+1}. {station.get('name', 'Unknown')} - ID: {station.get('id', 'No ID')}")
        print(f"     Location: {station.get('latitude', 'N/A')}, {station.get('longitude', 'N/A')}")
        print(f"     Connectors: {station.get('connector_types', [])}")
        print(f"     Available slots: {station.get('available_slots', 0)}/{station.get('total_slots', 0)}")
        print()
    
    # Test the hybrid algorithm
    print("🧮 Testing Hybrid Algorithm...")
    hybrid = HybridAlgorithm()
    
    # Test coordinates (Kathmandu to Pokhara)
    user_location = [27.7172, 85.3240]  # Kathmandu
    destination_city = "Pokhara"
    
    print(f"📍 User location: {user_location}")
    print(f"🎯 Destination: {destination_city}")
    
    # Get destination coordinates
    dest_coords = hybrid.get_city_coordinates(destination_city)
    if dest_coords:
        print(f"🎯 Destination coordinates: {dest_coords}")
        
        # Test route filtering for a few stations
        print("\n🛣️ Testing route filtering:")
        for station in stations[:3]:
            station_location = [station.get('latitude', 0), station.get('longitude', 0)]
            route_analysis = hybrid.is_station_along_route(
                user_location, dest_coords, station_location, 
                max_detour_km=20, urgency='high'
            )
            
            print(f"  {station.get('name', 'Unknown')}:")
            print(f"    Along route: {route_analysis['is_along_route']}")
            print(f"    Detour distance: {route_analysis['detour_distance']:.1f}km")
            print(f"    Angle difference: {route_analysis['angle_difference']:.1f}°")
            print()
    else:
        print(f"❌ Could not find coordinates for {destination_city}")
    
    print("✅ Station check completed!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the project root directory")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1) 