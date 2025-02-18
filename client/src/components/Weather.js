import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import React, { useState, useEffect } from "react";
import L from "leaflet"; // Import the Leaflet library
import WeatherAlerts from './WeatherAlerts';

// Fix for default icon not displaying in React-Leaflet
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const Weather = ({ latitude, longitude }) => {
  const [weatherData, setWeatherData] = useState(null); // Stores fetched weather data
  const [error, setError] = useState(""); // Stores error messages

  // Function to fetch weather data based on latitude and longitude
  const fetchWeather = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/weather/?lat=${latitude}&lon=${longitude}`);
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      const data = await response.json();
      setWeatherData(data); // Store the fetched weather data
      setError(""); // Clear error message if successful
    } catch (err) {
      setError("Failed to fetch weather data");
      setWeatherData(null);
    }
  };


  // Function to handle map click events and update latitude & longitude
  function LocationMarker() {
    useMapEvents({
      click(e) {
                latitude = e.latlng.lat.toFixed(6); // Update latitude with clicked location
                longitude = e.latlng.lng.toFixed(6); // Update longitude with clicked location
      },
    });
    return latitude && longitude ? (
      <Marker position={[latitude, longitude]} icon={defaultIcon} />
    ) : null;
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
      {/* Weather Section - Displays weather forecast for selected coordinates */}
      <div style={{ flex: 1, textAlign: "center" }}>
        <h2>Weather Forecast</h2>
        <div style={{ height: "300px", width: "100%", marginBottom: "10px" }}>
          <MapContainer center={[53.49, -7.562]} zoom={7} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker />
          </MapContainer>
        </div>
        <input type="text" placeholder="Latitude" value={latitude} readOnly />
        <input type="text" placeholder="Longitude" value={longitude} readOnly />
        <button onClick={fetchWeather}>Get Weather</button>
                {weatherData && weatherData.length === 24 && (
          <div>
                        {weatherData.map((data, index) => (
                            <div key={index}>
                                <p>At {data.time}:</p>
                                <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                                    <p>Temperature: {data.temperature}°C</p>
                                    <p>Cloudiness: {data.cloudiness}%</p>
                                    <p>Wind Speed: {data.wind_speed} km/h {data.wind_direction}</p>
                                    <p>Precipitation: {data.rain} mm</p>
                                </div>
                            </div>
                        ))}
          </div>
        )}
      </div>

      {/* Weather Alerts Section - Displays weather alerts for selected coordinates */}
      <div style={{ flex: 1, textAlign: "center" }}>
        <WeatherAlerts latitude={latitude} longitude={longitude} />
      </div>

      {/* Error Message Display */}
      {error && (
        <div style={{ position: "absolute", bottom: "20px", left: "20px", color: "red" }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Weather;
