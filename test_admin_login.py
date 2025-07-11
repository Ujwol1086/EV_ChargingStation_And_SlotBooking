import requests
import json

# Test admin login
def test_admin_login():
    url = "http://localhost:5000/auth/login"
    
    # Admin credentials
    admin_data = {
        "email": "admin@evconnect.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, json=admin_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Admin login successful!")
            print(f"User: {data['user']['username']}")
            print(f"Email: {data['user']['email']}")
            print(f"Role: {data['user'].get('role', 'Not set')}")
            print(f"Is Admin: {data.get('is_admin', False)}")
            print(f"Token: {data['token'][:50]}...")
        else:
            print("❌ Admin login failed!")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_admin_login() 