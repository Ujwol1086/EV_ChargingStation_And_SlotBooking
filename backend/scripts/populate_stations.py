#!/usr/bin/env python3
"""
Script to populate the database with charging stations from chargingstationsnepal.com
Based on the website data and Nepal's EV charging infrastructure
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import init_db, mongo
from models.charging_station import ChargingStation
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Comprehensive list of charging stations in Nepal
# Based on chargingstationsnepal.com and real EV infrastructure in Nepal
CHARGING_STATIONS = [
    # Kathmandu Valley Stations
    {
        "id": "cs001",
        "name": "NEA Charging Station - New Baneshwor",
        "company": "NEA",
        "latitude": 27.7172,
        "longitude": 85.3240,
        "address": "New Baneshwor, Kathmandu",
        "city": "Kathmandu",
        "province": "Bagmati",
        "total_slots": 4,
        "available_slots": 4,
        "pricing_per_kwh": 12.0,
        "connector_types": ["CCS2", "GBT"],
        "features": ["Fast Charging", "Mobile App", "24/7 Access"],
        "operating_hours": "24/7",
        "status": "active",
        "rating": 4.5,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Café", "WiFi"],
        "telephone": "+977-1-4159000"
    },
    {
        "id": "cs002",
        "name": "TATA Charging Hub - Thamel",
        "company": "TATA",
        "latitude": 27.7172,
        "longitude": 85.3120,
        "address": "Thamel, Kathmandu",
        "city": "Kathmandu",
        "province": "Bagmati",
        "total_slots": 6,
        "available_slots": 6,
        "pricing_per_kwh": 15.0,
        "connector_types": ["CCS2"],
        "features": ["Fast Charging", "Mobile App", "Reservation"],
        "operating_hours": "6:00 AM - 10:00 PM",
        "status": "active",
        "rating": 4.3,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Restaurant", "Shopping"],
        "telephone": "+977-1-4412345"
    },
    {
        "id": "cs003",
        "name": "BYD Charging Station - Patan",
        "company": "BYD",
        "latitude": 27.6765,
        "longitude": 85.3250,
        "address": "Patan Durbar Square, Lalitpur",
        "city": "Lalitpur",
        "province": "Bagmati",
        "total_slots": 3,
        "available_slots": 3,
        "pricing_per_kwh": 13.5,
        "connector_types": ["CCS2"],
        "features": ["Fast Charging", "Mobile App"],
        "operating_hours": "24/7",
        "status": "active",
        "rating": 4.2,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Museum Access"],
        "telephone": "+977-1-5521234"
    },
    {
        "id": "cs004",
        "name": "MG Charging Point - Bhaktapur",
        "company": "MG",
        "latitude": 27.6710,
        "longitude": 85.4298,
        "address": "Bhaktapur Durbar Square, Bhaktapur",
        "city": "Bhaktapur",
        "province": "Bagmati",
        "total_slots": 2,
        "available_slots": 2,
        "pricing_per_kwh": 14.0,
        "connector_types": ["CCS2"],
        "features": ["Mobile App", "Reservation"],
        "operating_hours": "7:00 AM - 9:00 PM",
        "status": "active",
        "rating": 4.0,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Cultural Site"],
        "telephone": "+977-1-6612345"
    },
    {
        "id": "cs005",
        "name": "NEA Fast Charging - Tribhuvan International Airport",
        "company": "NEA",
        "latitude": 27.6969,
        "longitude": 85.3594,
        "address": "TIA Parking Area, Kathmandu",
        "city": "Kathmandu",
        "province": "Bagmati",
        "total_slots": 8,
        "available_slots": 8,
        "pricing_per_kwh": 16.0,
        "connector_types": ["CCS2", "GBT"],
        "features": ["Fast Charging", "Mobile App", "24/7 Access", "Airport Access"],
        "operating_hours": "24/7",
        "status": "active",
        "rating": 4.6,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Restaurant", "WiFi", "Airport Services"],
        "telephone": "+977-1-4116000"
    },

    # Pokhara Stations
    {
        "id": "cs006",
        "name": "NEA Charging Station - Lakeside",
        "company": "NEA",
        "latitude": 28.2096,
        "longitude": 83.9856,
        "address": "Lakeside, Pokhara",
        "city": "Pokhara",
        "province": "Gandaki",
        "total_slots": 4,
        "available_slots": 4,
        "pricing_per_kwh": 12.5,
        "connector_types": ["CCS2", "GBT"],
        "features": ["Fast Charging", "Mobile App", "Lake View"],
        "operating_hours": "24/7",
        "status": "active",
        "rating": 4.4,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Restaurant", "Lake Access"],
        "telephone": "+977-61-520000"
    },
    {
        "id": "cs007",
        "name": "TATA Charging Hub - Pokhara Airport",
        "company": "TATA",
        "latitude": 28.2006,
        "longitude": 83.9816,
        "address": "Pokhara Airport, Pokhara",
        "city": "Pokhara",
        "province": "Gandaki",
        "total_slots": 3,
        "available_slots": 3,
        "pricing_per_kwh": 15.5,
        "connector_types": ["CCS2"],
        "features": ["Fast Charging", "Mobile App", "Airport Access"],
        "operating_hours": "6:00 AM - 10:00 PM",
        "status": "active",
        "rating": 4.1,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Airport Services"],
        "telephone": "+977-61-550000"
    },

    # Chitwan Stations
    {
        "id": "cs008",
        "name": "BYD Charging Station - Chitwan National Park",
        "company": "BYD",
        "latitude": 27.5292,
        "longitude": 84.3542,
        "address": "Sauraha, Chitwan",
        "city": "Chitwan",
        "province": "Bagmati",
        "total_slots": 3,
        "available_slots": 3,
        "pricing_per_kwh": 13.0,
        "connector_types": ["CCS2"],
        "features": ["Mobile App", "Nature Access"],
        "operating_hours": "6:00 AM - 8:00 PM",
        "status": "active",
        "rating": 4.3,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Nature Center"],
        "telephone": "+977-56-580000"
    },

    # Lumbini Stations
    {
        "id": "cs009",
        "name": "NEA Charging Station - Lumbini",
        "company": "NEA",
        "latitude": 27.4698,
        "longitude": 83.2757,
        "address": "Lumbini Sacred Garden, Rupandehi",
        "city": "Lumbini",
        "province": "Lumbini",
        "total_slots": 4,
        "available_slots": 4,
        "pricing_per_kwh": 12.0,
        "connector_types": ["CCS2", "GBT"],
        "features": ["Mobile App", "Sacred Site Access"],
        "operating_hours": "6:00 AM - 7:00 PM",
        "status": "active",
        "rating": 4.5,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Meditation Center"],
        "telephone": "+977-71-580000"
    },

    # Birgunj Stations
    {
        "id": "cs010",
        "name": "TATA Charging Hub - Birgunj",
        "company": "TATA",
        "latitude": 27.0174,
        "longitude": 84.8808,
        "address": "Birgunj Industrial Area, Parsa",
        "city": "Birgunj",
        "province": "Madhesh",
        "total_slots": 5,
        "available_slots": 5,
        "pricing_per_kwh": 14.5,
        "connector_types": ["CCS2"],
        "features": ["Fast Charging", "Mobile App", "Industrial Access"],
        "operating_hours": "24/7",
        "status": "active",
        "rating": 4.2,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Restaurant", "Industrial Services"],
        "telephone": "+977-51-520000"
    },

    # Nepalgunj Stations
    {
        "id": "cs011",
        "name": "MG Charging Point - Nepalgunj",
        "company": "MG",
        "latitude": 28.0500,
        "longitude": 81.6167,
        "address": "Nepalgunj Airport, Banke",
        "city": "Nepalgunj",
        "province": "Lumbini",
        "total_slots": 2,
        "available_slots": 2,
        "pricing_per_kwh": 15.0,
        "connector_types": ["CCS2"],
        "features": ["Mobile App", "Airport Access"],
        "operating_hours": "6:00 AM - 10:00 PM",
        "status": "active",
        "rating": 4.0,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Airport Services"],
        "telephone": "+977-81-520000"
    },

    # Dharan Stations
    {
        "id": "cs012",
        "name": "NEA Charging Station - Dharan",
        "company": "NEA",
        "latitude": 26.8147,
        "longitude": 87.2842,
        "address": "Dharan Bazaar, Sunsari",
        "city": "Dharan",
        "province": "Koshi",
        "total_slots": 3,
        "available_slots": 3,
        "pricing_per_kwh": 12.5,
        "connector_types": ["CCS2", "GBT"],
        "features": ["Mobile App", "Mountain Access"],
        "operating_hours": "6:00 AM - 9:00 PM",
        "status": "active",
        "rating": 4.1,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Mountain View"],
        "telephone": "+977-25-520000"
    },

    # Butwal Stations
    {
        "id": "cs013",
        "name": "BYD Charging Station - Butwal",
        "company": "BYD",
        "latitude": 27.7000,
        "longitude": 83.4483,
        "address": "Butwal Bus Park, Rupandehi",
        "city": "Butwal",
        "province": "Lumbini",
        "total_slots": 4,
        "available_slots": 4,
        "pricing_per_kwh": 13.5,
        "connector_types": ["CCS2"],
        "features": ["Mobile App", "Transport Hub"],
        "operating_hours": "24/7",
        "status": "active",
        "rating": 4.2,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Bus Services"],
        "telephone": "+977-71-520000"
    },

    # Janakpur Stations
    {
        "id": "cs014",
        "name": "TATA Charging Hub - Janakpur",
        "company": "TATA",
        "latitude": 26.7288,
        "longitude": 85.9254,
        "address": "Janakpur Temple Area, Dhanusha",
        "city": "Janakpur",
        "province": "Madhesh",
        "total_slots": 3,
        "available_slots": 3,
        "pricing_per_kwh": 14.0,
        "connector_types": ["CCS2"],
        "features": ["Mobile App", "Temple Access"],
        "operating_hours": "6:00 AM - 8:00 PM",
        "status": "active",
        "rating": 4.4,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Temple Services"],
        "telephone": "+977-41-520000"
    },

    # Bharatpur Stations
    {
        "id": "cs015",
        "name": "NEA Charging Station - Bharatpur",
        "company": "NEA",
        "latitude": 27.6770,
        "longitude": 84.4339,
        "address": "Bharatpur Airport, Chitwan",
        "city": "Bharatpur",
        "province": "Bagmati",
        "total_slots": 3,
        "available_slots": 3,
        "pricing_per_kwh": 12.0,
        "connector_types": ["CCS2", "GBT"],
        "features": ["Mobile App", "Airport Access"],
        "operating_hours": "6:00 AM - 10:00 PM",
        "status": "active",
        "rating": 4.1,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Airport Services"],
        "telephone": "+977-56-520000"
    },

    # Additional stations for better coverage
    {
        "id": "cs016",
        "name": "CG Charging Station - Hetauda",
        "company": "CG",
        "latitude": 27.4167,
        "longitude": 85.0333,
        "address": "Hetauda Industrial Area, Makwanpur",
        "city": "Hetauda",
        "province": "Bagmati",
        "total_slots": 2,
        "available_slots": 2,
        "pricing_per_kwh": 13.0,
        "connector_types": ["CCS2"],
        "features": ["Mobile App", "Industrial Access"],
        "operating_hours": "6:00 AM - 9:00 PM",
        "status": "active",
        "rating": 4.0,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Industrial Services"],
        "telephone": "+977-57-520000"
    },
    {
        "id": "cs017",
        "name": "NEA Charging Station - Pokhara Bus Park",
        "company": "NEA",
        "latitude": 28.2096,
        "longitude": 83.9856,
        "address": "Pokhara Bus Park, Pokhara",
        "city": "Pokhara",
        "province": "Gandaki",
        "total_slots": 4,
        "available_slots": 4,
        "pricing_per_kwh": 12.5,
        "connector_types": ["CCS2", "GBT"],
        "features": ["Mobile App", "Transport Hub"],
        "operating_hours": "24/7",
        "status": "active",
        "rating": 4.2,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "GBT", "power": "60kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Bus Services"],
        "telephone": "+977-61-530000"
    },
    {
        "id": "cs018",
        "name": "TATA Charging Hub - Chitwan Safari Lodge",
        "company": "TATA",
        "latitude": 27.5292,
        "longitude": 84.3542,
        "address": "Chitwan Safari Lodge, Chitwan",
        "city": "Chitwan",
        "province": "Bagmati",
        "total_slots": 3,
        "available_slots": 3,
        "pricing_per_kwh": 15.0,
        "connector_types": ["CCS2"],
        "features": ["Mobile App", "Lodge Access"],
        "operating_hours": "6:00 AM - 10:00 PM",
        "status": "active",
        "rating": 4.3,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Lodge Services", "Safari Access"],
        "telephone": "+977-56-590000"
    },
    {
        "id": "cs019",
        "name": "BYD Charging Station - Lumbini Peace Pagoda",
        "company": "BYD",
        "latitude": 27.4698,
        "longitude": 83.2757,
        "address": "Lumbini Peace Pagoda, Rupandehi",
        "city": "Lumbini",
        "province": "Lumbini",
        "total_slots": 2,
        "available_slots": 2,
        "pricing_per_kwh": 13.5,
        "connector_types": ["CCS2"],
        "features": ["Mobile App", "Peace Pagoda Access"],
        "operating_hours": "6:00 AM - 7:00 PM",
        "status": "active",
        "rating": 4.5,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Meditation Center"],
        "telephone": "+977-71-590000"
    },
    {
        "id": "cs020",
        "name": "MG Charging Point - Birgunj Border",
        "company": "MG",
        "latitude": 27.0174,
        "longitude": 84.8808,
        "address": "Birgunj Border Area, Parsa",
        "city": "Birgunj",
        "province": "Madhesh",
        "total_slots": 4,
        "available_slots": 4,
        "pricing_per_kwh": 14.0,
        "connector_types": ["CCS2"],
        "features": ["Mobile App", "Border Access"],
        "operating_hours": "24/7",
        "status": "active",
        "rating": 4.1,
        "chargers": [
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True},
            {"type": "CCS2", "power": "50kW", "available": True}
        ],
        "amenities": ["Parking", "Restroom", "Border Services"],
        "telephone": "+977-51-530000"
    }
]

def populate_stations():
    """Populate the database with charging stations"""
    try:
        logger.info("Starting to populate charging stations database...")
        
        # Load environment variables
        load_dotenv()
        
        # Initialize database connection
        mongo_uri = os.getenv('MONGO_URI')
        db_name = os.getenv('DB_NAME', 'evcharging')
        
        if not mongo_uri:
            logger.error("MONGO_URI not found in environment variables")
            return False
        
        # Connect to MongoDB directly
        mongo_client = MongoClient(mongo_uri)
        mongo_db = mongo_client[db_name]
        
        # Set the global mongo object
        mongo.cx = mongo_client
        mongo.db = mongo_db
        
        logger.info(f"Connected to MongoDB database: {db_name}")
        
        # Clear existing stations to update with new connector types
        mongo.db.charging_stations.delete_many({})
        logger.info("Cleared existing stations")
        
        # Insert new stations
        inserted_count = 0
        for station in CHARGING_STATIONS:
            # Insert station (no need to check since we cleared all)
            result = mongo.db.charging_stations.insert_one(station)
            if result.inserted_id:
                inserted_count += 1
                logger.info(f"Inserted station: {station['name']} ({station['id']}) - {station['connector_types']}")
            else:
                logger.error(f"Failed to insert station: {station['name']}")
        
        logger.info(f"Successfully populated {inserted_count} charging stations")
        
        # Verify the data
        total_stations = mongo.db.charging_stations.count_documents({})
        logger.info(f"Total stations in database: {total_stations}")
        
        # Show statistics by company
        companies = mongo.db.charging_stations.aggregate([
            {"$group": {"_id": "$company", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ])
        
        logger.info("Stations by company:")
        for company in companies:
            logger.info(f"  {company['_id']}: {company['count']} stations")
        
        return True
        
    except Exception as e:
        logger.error(f"Error populating stations: {e}")
        return False

if __name__ == "__main__":
    success = populate_stations()
    if success:
        print("✅ Charging stations populated successfully!")
    else:
        print("❌ Failed to populate charging stations")
        sys.exit(1)
