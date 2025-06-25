import requests
import json

def test_recommendation_api():
    """Test the recommendation API endpoints"""
    
    base_url = "http://localhost:5000"
    
    print("=== Testing Recommendation API ===\n")
    
    # Test data
    test_credentials = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    # Step 1: Register a test user
    print("1. Registering test user...")
    try:
        register_response = requests.post(
            f"{base_url}/auth/register",
            json={
                "username": test_credentials["username"],
                "email": "test@example.com",
                "password": test_credentials["password"]
            }
        )
        print(f"Register Status: {register_response.status_code}")
        if register_response.status_code not in [200, 201, 400]:  # 400 might be user already exists
            print(f"Register Response: {register_response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the Flask app is running.")
        return
    
    # Step 2: Login to get token
    print("\n2. Logging in...")
    try:
        login_response = requests.post(
            f"{base_url}/auth/login",
            json=test_credentials
        )
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            if login_data.get('success'):
                token = login_data['data']['token']
                print("✅ Login successful!")
            else:
                print(f"❌ Login failed: {login_data.get('error')}")
                return
        else:
            print(f"❌ Login failed: {login_response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Headers with authentication
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Step 3: Test recommendations API
    print("\n3. Testing recommendations API...")
    recommendation_data = {
        "latitude": 27.7172,  # Kathmandu coordinates
        "longitude": 85.324,
        "battery_percentage": 25,
        "plug_type": "CCS",
        "urgency_level": "high"
    }
    
    try:
        rec_response = requests.post(
            f"{base_url}/recommendations/get-recommendations",
            json=recommendation_data,
            headers=headers
        )
        print(f"Recommendations Status: {rec_response.status_code}")
        print(f"Response Headers: {dict(rec_response.headers)}")
        
        if rec_response.status_code == 200:
            rec_data = rec_response.json()
            if rec_data.get('success'):
                print("✅ Recommendations API working!")
                print(f"Found {len(rec_data.get('recommendations', {}).get('recommendations', []))} recommendations")
                
                # Print first recommendation details
                recs = rec_data.get('recommendations', {}).get('recommendations', [])
                if recs:
                    first_rec = recs[0]
                    print(f"\nTop Recommendation:")
                    print(f"  Station: {first_rec['station']['name']}")
                    print(f"  Distance: {first_rec['distance']} km")
                    print(f"  Score: {first_rec['score']}")
                    print(f"  Auto-booked: {first_rec.get('auto_booking', {}).get('auto_booked', False)}")
                
                # Check for auto-bookings
                if rec_data.get('auto_bookings'):
                    print(f"\n🔄 Auto-bookings created: {len(rec_data['auto_bookings'])}")
                    for booking in rec_data['auto_bookings']:
                        print(f"  Booking ID: {booking['booking_id']}")
            else:
                print(f"❌ Recommendations failed: {rec_data.get('error')}")
        else:
            print(f"❌ Recommendations failed: {rec_response.text}")
    except Exception as e:
        print(f"❌ Recommendations error: {e}")
    
    # Step 4: Test user bookings
    print("\n4. Testing user bookings API...")
    try:
        bookings_response = requests.get(
            f"{base_url}/recommendations/my-bookings",
            headers=headers
        )
        print(f"Bookings Status: {bookings_response.status_code}")
        
        if bookings_response.status_code == 200:
            bookings_data = bookings_response.json()
            if bookings_data.get('success'):
                bookings = bookings_data.get('bookings', [])
                print(f"✅ Found {len(bookings)} user bookings")
                for booking in bookings[:3]:  # Show first 3
                    print(f"  - {booking.get('station_details', {}).get('name', 'Unknown')} ({booking.get('status')})")
            else:
                print(f"❌ Bookings failed: {bookings_data.get('error')}")
        else:
            print(f"❌ Bookings failed: {bookings_response.text}")
    except Exception as e:
        print(f"❌ Bookings error: {e}")
    
    # Step 5: Test route calculation
    print("\n5. Testing route calculation...")
    route_data = {
        "user_location": [27.7172, 85.324],  # Kathmandu
        "station_location": [27.7219, 85.3132]  # Different location in Kathmandu
    }
    
    try:
        route_response = requests.post(
            f"{base_url}/recommendations/route-to-station",
            json=route_data,
            headers=headers
        )
        print(f"Route Status: {route_response.status_code}")
        
        if route_response.status_code == 200:
            route_data = route_response.json()
            if route_data.get('success'):
                print("✅ Route calculation working!")
                metrics = route_data.get('metrics', {})
                print(f"  Distance: {metrics.get('total_distance')} km")
                print(f"  Estimated time: {metrics.get('estimated_time')}")
                print(f"  Algorithm: {route_data.get('algorithm_used')}")
                print(f"  Waypoints: {metrics.get('waypoint_count')}")
            else:
                print(f"❌ Route failed: {route_data.get('error')}")
        else:
            print(f"❌ Route failed: {route_response.text}")
    except Exception as e:
        print(f"❌ Route error: {e}")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_recommendation_api() 