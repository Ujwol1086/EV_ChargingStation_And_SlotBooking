#!/usr/bin/env python3
"""
Debug script to examine station data structure
"""

import sys
import os
import json

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def debug_station_data():
    """Debug the actual station data structure"""
    print("🔍 Debugging station data structure...")
    
    try:
        from models.charging_station import ChargingStation
        stations = ChargingStation.get_all()
        
        if not stations:
            print("❌ No stations found")
            return
        
        print(f"📊 Found {len(stations)} stations")
        
        # Examine first station in detail
        first_station = stations[0]
        print(f"\n🏢 First station data:")
        print(f"   Type: {type(first_station)}")
        print(f"   Keys: {list(first_station.keys()) if isinstance(first_station, dict) else 'Not a dict'}")
        
        # Check location structure
        if 'location' in first_station:
            location = first_station['location']
            print(f"\n📍 Location data:")
            print(f"   Type: {type(location)}")
            print(f"   Value: {location}")
            
            if isinstance(location, dict):
                print(f"   Keys: {list(location.keys())}")
                if 'coordinates' in location:
                    coords = location['coordinates']
                    print(f"   Coordinates: {coords} (type: {type(coords)})")
        
        # Test location extraction logic
        print(f"\n🧪 Testing location extraction...")
        
        for i, station in enumerate(stations[:3]):  # Test first 3 stations
            print(f"\nStation {i+1}: {station.get('name', 'Unknown')}")
            
            # Test the location extraction logic
            station_location = None
            if 'location' in station:
                if isinstance(station['location'], dict) and 'coordinates' in station['location']:
                    station_location = station['location']['coordinates']
                    print(f"   ✅ Extracted coordinates: {station_location}")
                elif isinstance(station['location'], list) and len(station['location']) == 2:
                    station_location = station['location']
                    print(f"   ✅ Found list coordinates: {station_location}")
                else:
                    print(f"   ❌ Location format not recognized: {station['location']}")
            else:
                print(f"   ❌ No location field found")
            
            if station_location and len(station_location) == 2:
                print(f"   ✅ Valid location: {station_location}")
            else:
                print(f"   ❌ Invalid location: {station_location}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_station_data() 