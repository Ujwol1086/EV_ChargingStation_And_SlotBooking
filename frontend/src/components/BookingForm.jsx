import { useState } from "react";
import { useAuth } from "../context/useAuth";

const BookingForm = ({ stationId, stationName, onBookingComplete }) => {
  const { isAuthenticated, user } = useAuth();
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [chargerType, setChargerType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Generate time slots from 6 AM to 10 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
      const amPm = hour < 12 ? "AM" : "PM";
      slots.push({
        value: `${hour}:00`,
        label: `${formattedHour}:00 ${amPm}`,
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

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
            onChange={(e) => setDate(e.target.value)}
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
          <select
            id="timeSlot"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={!isAuthenticated || loading}
            required
          >
            <option value="">Select a time slot</option>
            {timeSlots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
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
            onChange={(e) => setChargerType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={!isAuthenticated || loading}
            required
          >
            <option value="">Select charger type</option>
            <option value="CCS">CCS</option>
            <option value="CHAdeMO">CHAdeMO</option>
            <option value="Type 2">Type 2</option>
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
