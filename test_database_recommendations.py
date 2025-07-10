#!/usr/bin/env python3

import sys
import os
sys.path.append('backend')

from services.Hybrid_Algorithm import HybridAlgorithm
from models.charging_station import ChargingStation

def test_database_recommendations():
    # Load algorithm
    algo = HybridAlgorithm()
    
    # Get stations from database (same as the route)
    stations = ChargingStation.get_all()
    print(f"Loaded {len(stations)} stations from database")
    
    # Test parameters (same as your frontend)
    user_location = [27.7171465, 85.3027061]  # Kathmandu
    user_context = {
        'destination_city': 'Pokhara',
        'battery_percentage': 80,
        'ac_status': True,
        'passengers': 2,
        'terrain': 'hilly',
        'plug_type': 'Type 2',
        'urgency': 'medium'
    }
    
    print(f"\nUser Context: {user_context}")
    print(f"User Location: {user_location}")
    
    # Debug route filtering
    destination_coords = algo.get_city_coordinates('Pokhara')
    print(f"Destination coordinates: {destination_coords}")
    
    # Check how many stations are along the route
    route_stations = []
    for station in stations:
        station_location = [station.get('latitude', 0), station.get('longitude', 0)]
        
        route_analysis = algo.is_station_along_route(
            user_location, 
            destination_coords, 
            station_location,
            max_detour_km=20,
            urgency='medium'
        )
        
        if route_analysis['is_along_route']:
            route_stations.append({
                'id': station.get('id'),
                'name': station.get('name'),
                'location': station_location,
                'detour': route_analysis['detour_distance'],
                'efficiency': route_analysis['route_efficiency']
            })
    
    print(f"\nStations along route to Pokhara: {len(route_stations)}")
    print(f"Stations filtered out: {len(stations) - len(route_stations)}")
    
    # Show first 10 route stations
    for i, station in enumerate(route_stations[:10], 1):
        print(f"{i}. {station['name']} (Detour: {station['detour']:.1f}km, Efficiency: {station['efficiency']:.3f})")
    
    # Test the full recommendation algorithm
    print(f"\n{'='*60}")
    print("Testing full recommendation algorithm...")
    print('='*60)
    
    result = algo.get_enhanced_recommendations(
        user_location, 
        stations, 
        user_context
    )
    
    print(f"Generated {len(result['recommendations'])} recommendations")
    print(f"Algorithm info: {result['algorithm_info']}")
    
    if result['recommendations']:
        print("\nTop recommendations:")
        for i, rec in enumerate(result['recommendations'][:5], 1):
            print(f"{i}. {rec['name']}")
            print(f"   Score: {rec['score']:.3f}")
            print(f"   Distance: {rec['distance']}km")
            print(f"   Connector types: {rec['connector_types']}")
            print(f"   Reachable: {rec['is_reachable']}")
            if 'route_analysis' in rec:
                print(f"   Route efficiency: {rec['route_analysis']['route_efficiency']:.3f}")
            print()
    else:
        print("No recommendations generated!")
        
        # Debug why no recommendations
        print("\nDebugging why no recommendations:")
        
        # Check if any stations pass the initial filtering
        scored_stations = []
        for station in stations:
            try:
                station_location = [station.get('latitude', 0), station.get('longitude', 0)]
                
                # Calculate distance
                distance = algo.haversine_distance(
                    user_location[0], user_location[1],
                    station_location[0], station_location[1]
                )
                
                # Normalize station data
                normalized_station = algo._normalize_station_data(station)
                
                # Calculate score
                score_analysis = algo.calculate_enhanced_score(normalized_station, distance, user_context)
                
                scored_stations.append({
                    'id': station.get('id'),
                    'name': station.get('name'),
                    'score': score_analysis['total_score'],
                    'distance': distance,
                    'is_reachable': score_analysis['is_reachable']
                })
                
            except Exception as e:
                print(f"Error processing station {station.get('id', 'unknown')}: {e}")
        
        print(f"Stations with scores: {len(scored_stations)}")
        if scored_stations:
            # Sort by score
            scored_stations.sort(key=lambda x: x['score'], reverse=True)
            print("\nTop 10 scored stations:")
            for i, station in enumerate(scored_stations[:10], 1):
                print(f"{i}. {station['name']} (Score: {station['score']:.3f}, Distance: {station['distance']:.1f}km, Reachable: {station['is_reachable']})")

if __name__ == "__main__":
    test_database_recommendations() 