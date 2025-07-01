# EVConnectNepal Hybrid Algorithm Documentation

## Table of Contents
1. [Overview](#overview)
2. [Algorithm Components](#algorithm-components)
3. [Core Algorithms](#core-algorithms)
4. [Context-Aware Features](#context-aware-features)
5. [Integration Points](#integration-points)
6. [Usage Examples](#usage-examples)
7. [Performance Considerations](#performance-considerations)

## Overview

The EVConnectNepal system implements a sophisticated **Hybrid Recommendation Algorithm** that combines multiple algorithmic approaches to provide intelligent charging station recommendations for electric vehicle users in Nepal. The algorithm is designed to handle the unique challenges of EV charging in a developing country with diverse terrain and infrastructure constraints.

### Key Features
- **Multi-Criteria Decision Making (MCDM)** for comprehensive station scoring
- **Context-aware energy consumption** calculations
- **Real-time availability** tracking
- **Route-based filtering** for destination-oriented recommendations
- **Load balancing** across charging stations
- **Emergency booking** capabilities for critical situations

## Algorithm Components

### 1. Core Scoring System (`calculate_enhanced_score`)

The algorithm uses a weighted scoring system with the following components:

```python
weights = {
    'distance': 0.25,           # 25% - Proximity to user
    'availability': 0.20,       # 20% - Real-time slot availability
    'energy_efficiency': 0.15,  # 15% - Energy consumption optimization
    'urgency': 0.15,           # 15% - User urgency level
    'price': 0.10,             # 10% - Cost considerations
    'plug_compatibility': 0.10, # 10% - Charger compatibility
    'rating': 0.05             # 5% - User ratings
}
```

### 2. Energy Consumption Calculator (`calculate_energy_consumption`)

**Purpose**: Calculates realistic energy consumption based on multiple contextual factors.

**Factors Considered**:
- **Base consumption**: 0.2 kWh per km (standard EV efficiency)
- **AC usage**: +15% energy penalty when air conditioning is active
- **Passenger load**: +3% per additional passenger beyond driver
- **Terrain impact**: 
  - Flat: 1.0x (no penalty)
  - Hilly: 1.2x (+20% energy)
  - Steep: 1.5x (+50% energy)

**Output**: Determines if destination is reachable with current battery level and provides efficiency scoring.

### 3. ETA Calculator (`calculate_eta`)

**Purpose**: Provides realistic travel time estimates considering multiple real-world factors.

**Factors Considered**:
- **Driving modes**:
  - Economy: 30 km/h (energy-efficient)
  - Sports: 60 km/h (performance-oriented)
  - Random: 45 km/h (mixed driving)
- **Traffic conditions**:
  - Heavy: 60% of normal speed
  - Medium: 80% of normal speed
  - Light: 100% of normal speed
- **Terrain impact**:
  - Flat: No speed impact
  - Hilly: 20% slower
  - Steep: 40% slower
- **Weather conditions**:
  - Clear: No impact
  - Rain: 10% slower
  - Fog: 30% slower
  - Snow: 50% slower

### 4. Route-Based Filtering (`is_station_along_route`)

**Purpose**: Filters charging stations that are along the user's intended route to minimize detours.

**Algorithm**: Uses bearing calculations and distance thresholds to determine if a station is within acceptable detour distance from the optimal route.

### 5. Load Balancing (`load_balancing_recommendation`)

**Purpose**: Distributes charging demand across available stations to prevent overloading.

**Strategy**: Considers current station utilization and recommends alternatives to prevent congestion.

## Core Algorithms

### 1. Dijkstra's Shortest Path (`dijkstra_shortest_path`)

**Purpose**: Finds optimal routes between user location and charging stations.

**Implementation**: Uses min-heap priority queue for efficient pathfinding.

### 2. Min-Heap Priority Queue (`min_heap_insert`, `min_heap_extract`)

**Purpose**: Efficiently manages priority queue for Dijkstra's algorithm.

**Operations**:
- `min_heap_insert`: O(log n) insertion
- `min_heap_extract`: O(log n) extraction
- `_bubble_up` and `_bubble_down`: Maintain heap property

### 3. Merge Sort (`merge_sort_stations`)

**Purpose**: Sorts final recommendations by composite score.

**Complexity**: O(n log n) time complexity for stable sorting.

### 4. Haversine Distance (`haversine_distance`)

**Purpose**: Calculates accurate geographic distances between coordinates.

**Formula**: Uses spherical trigonometry for precise distance calculations.

## Context-Aware Features

### 1. User Context Integration

The algorithm accepts comprehensive user context:

```python
user_context = {
    'battery_percentage': 80,      # Current battery level
    'plug_type': 'Type 2',         # Vehicle charger compatibility
    'urgency': 'medium',           # User urgency level
    'ac_status': False,            # Air conditioning status
    'passengers': 2,               # Number of passengers
    'terrain': 'hilly',            # Route terrain type
    'destination_city': 'Pokhara', # Intended destination
    'max_detour_km': 20            # Maximum acceptable detour
}
```

### 2. Real-Time Availability

**Data Source**: MongoDB booking system with real-time slot tracking.

**Calculation**: 
- Total slots per station
- Currently occupied slots
- Available slots by charger type
- Booking duration considerations

### 3. Emergency Booking System

**Purpose**: Handles critical battery situations with instant booking capabilities.

**Features**:
- Automatic slot allocation
- Priority booking queue
- Instant confirmation
- Real-time availability checks

## Integration Points

### 1. Backend API Integration

**Primary Endpoints**:
- `/recommendations/enhanced` - Main recommendation endpoint
- `/recommendations/route-to-city` - Route-based recommendations
- `/recommendations/instant-book` - Emergency booking
- `/recommendations/auto-book-slot` - Automated booking

### 2. Frontend Integration

**Components**:
- `RecommendationForm.jsx` - User input collection
- `RecommendationResults.jsx` - Results display with score breakdown
- `Map.jsx` - Geographic visualization
- `RouteMap.jsx` - Route planning interface

### 3. Database Integration

**Models**:
- `ChargingStation` - Station data and availability
- `Booking` - Real-time booking management
- `User` - User preferences and history

## Usage Examples

### 1. Basic Recommendation Request

```javascript
// Frontend request
const requestData = {
  location: [27.7172, 85.3240],  // Kathmandu coordinates
  battery_percentage: 75,
  plug_type: 'Type 2',
  urgency_level: 'medium'
};

// Backend processing
recommendations = hybrid_algorithm.get_enhanced_recommendations(
  user_location, 
  stations, 
  user_context
);
```

### 2. Route-Based Recommendation

```javascript
// Request with destination
const requestData = {
  location: [27.7172, 85.3240],  // Kathmandu
  destination_city: 'Pokhara',
  max_detour_km: 15,
  battery_percentage: 60,
  terrain: 'hilly'
};
```

### 3. Emergency Booking

```javascript
// High urgency instant booking
const bookingData = {
  station_id: 'station_123',
  urgency_level: 'emergency',
  battery_percentage: 15
};
```

## Performance Considerations

### 1. Algorithmic Complexity

- **Dijkstra's Algorithm**: O((V + E) log V) where V = vertices, E = edges
- **Scoring Algorithm**: O(n) where n = number of stations
- **Sorting**: O(n log n) for final ranking
- **Overall**: O(n log n) for typical use cases

### 2. Optimization Strategies

- **Caching**: Station data cached in memory
- **Indexing**: MongoDB indexes on location and availability
- **Batch Processing**: Multiple recommendations processed together
- **Lazy Loading**: Station data loaded on demand

### 3. Scalability Features

- **Geographic Partitioning**: Stations filtered by proximity first
- **Load Distribution**: Recommendations spread across multiple stations
- **Real-time Updates**: Availability updated continuously
- **Fallback Mechanisms**: Multiple data sources for reliability

## Technical Implementation Details

### 1. Error Handling

The algorithm includes comprehensive error handling:
- Invalid coordinates validation
- Missing data fallbacks
- Network timeout handling
- Database connection recovery

### 2. Data Validation

- Coordinate range validation (-90 to 90 lat, -180 to 180 lon)
- Battery percentage bounds (0-100%)
- Terrain type validation (flat, hilly, steep)
- Urgency level validation (low, medium, high, emergency)

### 3. Logging and Monitoring

- Detailed algorithm execution logging
- Performance metrics tracking
- Error rate monitoring
- User behavior analytics

## Conclusion

The EVConnectNepal Hybrid Algorithm represents a sophisticated approach to EV charging station recommendation that addresses the unique challenges of electric vehicle infrastructure in Nepal. By combining multiple algorithmic approaches with context-aware features, the system provides intelligent, real-time recommendations that optimize for user convenience, energy efficiency, and infrastructure utilization.

The algorithm's modular design allows for easy extension and modification, while its comprehensive error handling and fallback mechanisms ensure reliable operation in real-world conditions. The integration with both frontend and backend systems provides a seamless user experience while maintaining high performance and scalability. 