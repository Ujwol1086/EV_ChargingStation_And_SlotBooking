import requests
import json

# Test the recommendation API
def test_recommendation_api():
    url = "http://localhost:5000/api/recommendations/get-recommendations"
    
    # Test data
    test_data = {
        "location": [27.7172, 85.324],  # Kathmandu center
        "battery_percentage": 25,
        "plug_type": "CCS",
        "urgency": "high"
    }
    
    try:
        print("Testing Recommendation API...")
        print(f"Request URL: {url}")
        print(f"Request Data: {json.dumps(test_data, indent=2)}")
        
        response = requests.post(url, json=test_data)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse Data:")
            print(json.dumps(data, indent=2))
            
            if data.get('success'):
                recommendations = data.get('recommendations', [])
                print(f"\n✅ API Test Successful!")
                print(f"Found {len(recommendations)} recommendations")
                
                for i, rec in enumerate(recommendations):
                    station = rec['station']
                    print(f"\n{i+1}. {station['name']}")
                    print(f"   Distance: {rec['distance']} km")
                    print(f"   Score: {rec['score']}")
                    print(f"   Auto-booked: {rec['auto_booking']['auto_booked']}")
            else:
                print(f"❌ API returned error: {data.get('error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the Flask server is running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_recommendation_api() 