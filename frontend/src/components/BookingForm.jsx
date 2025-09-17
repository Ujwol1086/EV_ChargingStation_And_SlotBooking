import React, { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import axios from "../api/axios";

const BookingForm = ({ stationId, stationName, station, onBookingComplete }) => {
  const { isAuthenticated, user } = useAuth();
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [chargerType, setChargerType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Extract charger types from station and filter based on station capacity
  let availableConnectorTypes = station?.connector_types 
    ? (typeof station.connector_types === 'string' 
        ? station.connector_types.split(' ').filter(type => type.trim())
        : station.connector_types)
    : ['CCS2'];
  
  // If station has only 1 slot, show only CCS2
  // If station has more than 1 slot, show both CCS2 and GBT (if supported)
  const totalSlots = station?.total_slots || 0;
  if (totalSlots === 1) {
    // Single slot station - only show CCS2
    availableConnectorTypes = ['CCS2'];
  } else if (totalSlots > 1) {
    // Multi-slot station - show both CCS2 and GBT if supported
    const supportedTypes = [];
    if (availableConnectorTypes.includes('CCS2')) {
      supportedTypes.push('CCS2');
    }
    if (availableConnectorTypes.includes('GBT')) {
      supportedTypes.push('GBT');
    }
    availableConnectorTypes = supportedTypes.length > 0 ? supportedTypes : ['CCS2'];
  }
  
  const connectorTypes = availableConnectorTypes;

  // Set default charger type when station changes
  useEffect(() => {
    if (station && !chargerType) {
      setChargerType(connectorTypes[0] || 'CCS2');
    }
  }, [station, connectorTypes, chargerType]);

  // Fetch time slots when date or charger type changes
  useEffect(() => {
    if (date && chargerType && station?.id) {
      fetchTimeSlots();
    }
  }, [date, chargerType, station?.id]);

  const fetchTimeSlots = async () => {
    try {
      setLoadingTimeSlots(true);
      const response = await axios.post('/recommendations/get-time-slots', {
        station_id: station.id,
        charger_type: chargerType,
        booking_date: date
      });

      if (response.data.success) {
        setTimeSlots(response.data.time_slots);
      } else {
        setError('Failed to load time slots');
      }
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Error loading time slots');
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setTimeSlot(""); // Reset time slot when date changes
    setTimeSlots([]); // Clear time slots
  };

  const handleChargerTypeChange = (e) => {
    setChargerType(e.target.value);
    setTimeSlot(""); // Reset time slot when charger type changes
    setTimeSlots([]); // Clear time slots
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError("Please login to book a charging slot");
      return;
    }

    if (!date || !timeSlot || !chargerType) {
      setError("Please fill all the fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // In a real application, this would be an API call to book the slot
      // For now, we'll simulate a successful booking

      console.log("Booking details:", {
        userId: user?._id,
        stationId,
        date,
        timeSlot,
        chargerType,
      });

      // Simulate API call
      setTimeout(() => {
        setSuccess(true);
        setLoading(false);
        if (onBookingComplete) {
          onBookingComplete();
        }
      }, 1000);
    } catch (err) {
      setError("Failed to book slot. Please try again.");
      setLoading(false);
      console.error(err);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <p className="text-green-800 font-medium">
          Booking confirmed for {stationName} on {date} at {timeSlot}.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setDate("");
            setTimeSlot("");
            setChargerType("");
          }}
          className="mt-2 text-sm text-green-600 hover:underline"
        >
          Book another slot
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">Book a Charging Slot</h3>

      {!isAuthenticated && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-yellow-800">
            Please{" "}
            <a href="/login" className="underline">
              login
            </a>{" "}
            to book a charging slot.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={handleDateChange}
            min={new Date().toISOString().split("T")[0]}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={!isAuthenticated || loading}
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="timeSlot"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Time Slot
          </label>
          {loadingTimeSlots ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading time slots...</p>
            </div>
          ) : timeSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => slot.available && setTimeSlot(slot.time)}
                  disabled={!slot.available}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    timeSlot === slot.time
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : slot.available
                      ? 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      : 'border-red-200 bg-red-50 text-red-500 cursor-not-allowed'
                  }`}
                >
                  <div className="font-semibold">{slot.display_time}</div>
                  <div className="text-xs mt-1">
                    {slot.available ? (
                      <span className="text-green-600">✓ {slot.available_slots}/{slot.total_slots} available</span>
                    ) : (
                      <span className="text-red-500">✗ BOOKED</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No time slots available for this date</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="chargerType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Charger Type
          </label>
          <select
            id="chargerType"
            value={chargerType}
            onChange={handleChargerTypeChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={!isAuthenticated || loading}
            required
          >
            <option value="">Select charger type</option>
            {connectorTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            !isAuthenticated || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={!isAuthenticated || loading}
        >
          {loading ? "Processing..." : "Book Slot"}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
