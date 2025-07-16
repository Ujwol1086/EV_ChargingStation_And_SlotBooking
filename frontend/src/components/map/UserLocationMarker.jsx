import { Marker, Popup } from "react-leaflet";
import { userLocationIcon, userLocationIconRed } from "../../utils/mapIcons";

const UserLocationMarker = ({ userLocation, batteryLevel = 80 }) => {
  if (!userLocation || userLocation.length !== 2) return null;

  const isLowBattery = batteryLevel < 20;
  const icon = isLowBattery ? userLocationIconRed : userLocationIcon;

  return (
    <Marker position={userLocation} icon={icon}>
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-gray-800 text-sm mb-1">📍 Your Location</h3>
          <p className="text-xs text-gray-600 mb-2">
            {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Battery:</span>
            <span className={`text-xs font-medium ${
              batteryLevel < 20 ? 'text-red-600' : 
              batteryLevel < 50 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {batteryLevel}%
            </span>
            {isLowBattery && (
              <span className="text-xs text-red-600 font-medium">⚠️ Low Battery</span>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default UserLocationMarker; 