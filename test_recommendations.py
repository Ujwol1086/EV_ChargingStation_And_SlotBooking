import requests
import json

# Test the recommendation API
def test_recommendations():
    url = "http://localhost:5000/api/recommendations/route-to-city"
    
    # Test data
    test_data = {
        "location": [27.7172, 85.3240],  # Kathmandu coordinates
        "destination_city": "Pokhara",
        "battery_percentage": 80,
        "plug_type": "Type 2",
        "urgency_level": "medium",
        "ac_status": False,
        "passengers": 1,
        "terrain": "flat",
        "max_detour_km": 20,
        "driving_mode": "random",
        "traffic_condition": "light",
        "weather": "clear"
    }
    
    print("Testing recommendation API...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('recommendations'):
                print(f"✅ Success! Found {len(data['recommendations'])} recommendations")
                for i, rec in enumerate(data['recommendations'][:3]):
                    print(f"  {i+1}. {rec.get('name')} - {rec.get('distance')}km away")
            else:
                print("❌ No recommendations found")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_recommendations() 