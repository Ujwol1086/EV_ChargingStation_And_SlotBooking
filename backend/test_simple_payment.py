#!/usr/bin/env python3
"""
Simple test for payment verification
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:5000/api"

def test_payment_verification():
    """Test payment verification endpoint"""
    print("🚀 Testing payment verification...")
    
    # Test payment verification with test data
    test_token = f"test_token_{int(time.time())}"
    test_amount = 5000  # 50 NPR in paisa
    
    payment_data = {
        "token": test_token,
        "amount": test_amount
    }
    
    print(f"Testing with token: {test_token}")
    print(f"Amount: {test_amount} paisa (₹{test_amount/100})")
    
    response = requests.post(f"{BASE_URL}/payments/verify-payment", json=payment_data)
    print(f"Payment verification status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        if data.get('success'):
            print("✅ Payment verification successful")
            print(f"   Booking ID: {data.get('booking_id')}")
            print(f"   Transaction ID: {data.get('transaction_id')}")
            print(f"   Test mode: {data.get('test_mode', False)}")
            
            # Check if booking data is returned
            if data.get('booking'):
                booking_data = data.get('booking')
                print(f"   ✅ Booking data received: {booking_data.get('booking_id')}")
                print(f"   Amount: ₹{booking_data.get('amount_npr', 'N/A')}")
                print(f"   Status: {booking_data.get('status', 'N/A')}")
                print(f"   Payment Status: {booking_data.get('payment_status', 'N/A')}")
                return True
            else:
                print("   ❌ No booking data in response")
                return False
        else:
            print(f"❌ Payment verification failed: {data.get('error')}")
            return False
    else:
        print(f"❌ Payment verification request failed: {response.text}")
        return False

if __name__ == "__main__":
    success = test_payment_verification()
    if success:
        print("\n🎉 Payment verification test completed successfully!")
        print("The payment success page should now work correctly.")
    else:
        print("\n❌ Payment verification test failed!")
        print("Check the logs above for details.") 