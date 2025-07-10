#!/usr/bin/env python3

import requests
import json

def test_api_response():
    # Test the actual API endpoint
    url = "http://localhost:5000/api/recommendations/route-to-city"
    
    # Test data (same as your frontend)
    data = {
        "location": [27.7171465, 85.3027061],  # Kathmandu
        "destination_city": "Pokhara",
        "battery_percentage": 80,
        "ac_status": True,
        "passengers": 2,
        "terrain": "hilly",
        "plug_type": "Type 2",
        "urgency_level": "medium"
    }
    
    try:
        print("Sending request to API...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(data, indent=2)}")
        
        response = requests.post(url, json=data, timeout=10)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\nResponse Data Keys: {list(result.keys())}")
            print(f"Success: {result.get('success', 'Not found')}")
            
            recommendations = result.get('recommendations', [])
            print(f"Recommendations type: {type(recommendations)}")
            print(f"Recommendations length: {len(recommendations)}")
            
            if recommendations:
                print("\nFirst recommendation:")
                print(json.dumps(recommendations[0], indent=2))
            else:
                print("\nNo recommendations in response!")
                
            algorithm_info = result.get('algorithm_info', {})
            print(f"\nAlgorithm Info: {algorithm_info}")
            
            user_context = result.get('user_context', {})
            print(f"\nUser Context: {user_context}")
            
        else:
            print(f"Error response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API server. Make sure the backend is running on localhost:5000")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api_response() 