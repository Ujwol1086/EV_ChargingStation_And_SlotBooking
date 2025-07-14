#!/usr/bin/env python3
"""
Simple test script for payment flow
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:5000/api"

def test_payment_flow():
    """Test the payment flow"""
    print("🚀 Testing payment flow...")
    
    # Step 1: Register user
    register_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "username": "testuser"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"Register status: {response.status_code}")
    
    # Step 2: Login
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        print("✅ Login successful")
    else:
        print(f"❌ Login failed: {response.text}")
        return False
    
    # Step 3: Get stations
    response = requests.get(f"{BASE_URL}/stations/list")
    if response.status_code == 200:
        data = response.json()
        stations = data.get('stations', [])
        if stations:
            station = stations[0]
            print(f"✅ Found station: {station['name']}")
        else:
            print("❌ No stations found")
            return False
    else:
        print(f"❌ Failed to get stations: {response.text}")
        return False
    
    # Step 4: Create booking
    headers = {"Authorization": f"Bearer {token}"}
    booking_data = {
        "station_id": station['id'],
        "charger_type": "Type 2",
        "plug_type": "Type 2",
        "urgency_level": "medium",
        "preferred_date": "2024-12-25",
        "preferred_time": "14:00",
        "station_details": station
    }
    
    response = requests.post(f"{BASE_URL}/recommendations/book-slot", 
                           json=booking_data, headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            booking = data.get('booking')
            print(f"✅ Booking created: {booking['booking_id']}")
            print(f"   Amount: ₹{booking.get('amount_npr', 'N/A')}")
            print(f"   Status: {booking.get('status', 'N/A')}")
        else:
            print(f"❌ Booking failed: {data.get('error')}")
            return False
    else:
        print(f"❌ Booking request failed: {response.text}")
        return False
    
    # Step 5: Test payment verification
    test_token = f"test_token_{int(time.time())}"
    test_amount = booking.get('amount_paisa', 5000)
    
    payment_data = {
        "token": test_token,
        "amount": test_amount
    }
    
    response = requests.post(f"{BASE_URL}/payments/verify-payment", 
                           json=payment_data, headers=headers)
    print(f"Payment verification status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print("✅ Payment verification successful")
            print(f"   Booking ID: {data.get('booking_id')}")
            print(f"   Transaction ID: {data.get('transaction_id')}")
            print(f"   Test mode: {data.get('test_mode', False)}")
            
            # Check if booking data is returned
            if data.get('booking'):
                booking_data = data.get('booking')
                print(f"   Booking data received: {booking_data.get('booking_id')}")
                print(f"   Amount: ₹{booking_data.get('amount_npr', 'N/A')}")
                print(f"   Status: {booking_data.get('status', 'N/A')}")
            else:
                print("   ⚠️ No booking data in response")
            
            return True
        else:
            print(f"❌ Payment verification failed: {data.get('error')}")
            return False
    else:
        print(f"❌ Payment verification request failed: {response.text}")
        return False

if __name__ == "__main__":
    success = test_payment_flow()
    if success:
        print("\n🎉 Payment flow test completed successfully!")
        print("The payment verification and success page should now work correctly.")
    else:
        print("\n❌ Payment flow test failed!")
        print("Check the logs above for details.") 