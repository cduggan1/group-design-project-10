import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import React, { useState, useEffect } from "react";
import L from "leaflet"; // Import the Leaflet library
import WeatherAlerts from "./WeatherAlerts";
import "./Weather.css";

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

const Weather = ({ latitude: initialLat, longitude: initialLon }) => {
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLon);
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState("");

  // Function to fetch weather data based on latitude and longitude
  const fetchWeather = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/weather/?lat=${latitude}&lon=${longitude}`);
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      const data = await response.json();
      setWeatherData(data);
      setError("");
    } catch (err) {
      setError("Failed to fetch weather data");
      setWeatherData(null);
    }
  };

  // Function to handle map click events and update latitude & longitude
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setLatitude(e.latlng.lat.toFixed(6));
        setLongitude(e.latlng.lng.toFixed(6));
      },
    });
    return latitude && longitude ? <Marker position={[latitude, longitude]} icon={defaultIcon} /> : null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
      {/* Weather Alerts Section - Now at the top */}
      <div style={{ width: "100%", textAlign: "center", marginBottom: "20px" }}>
        <WeatherAlerts latitude={latitude} longitude={longitude} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "30px" }}>
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
        </div>

        {/* Table Section - Displays weather data in a table beside the map */}
        <div style={{ flex: 1, textAlign: "center" }}>
          {weatherData && weatherData.length === 24 && (
            <div className="weather-table-container">
              <table className="weather-table">
              <thead>
                <tr>
                  <th>Time </th>
                  <th>Temperature</th>
                  <th>Cloudiness</th>
                  <th>Wind Speed</th>
                  <th>Precipitation</th>
                  <th style={{ borderLeft: '3px solid black' }}>Time</th>
                  <th>Temperature</th>
                  <th>Cloudiness</th>
                  <th>Wind Speed</th>
                  <th>Precipitation</th>
                </tr>
              </thead>
              <tbody>
                {weatherData &&
                  weatherData.length > 1 &&
                  weatherData.map((data, index) => {
                    if (index % 2 === 0) {
                      const nextData = weatherData[index + 1]; // Get the next hour data (pair)
                      return (
                        <tr key={index}>
                          <td>{data.time}</td>
                          <td>{data.temperature}°C</td>
                          <td>{data.cloudiness}%</td>
                          <td>{data.wind_speed} km/h</td>
                          <td>{data.rain} mm</td>

                          {nextData ? (
                            <>
                              <td style={{ borderLeft: '3px solid black' }}>{nextData.time}</td>
                              <td>{nextData.temperature}°C</td>
                              <td>{nextData.cloudiness}%</td>
                              <td>{nextData.wind_speed} km/h</td>
                              <td>{nextData.rain} mm</td>
                            </>
                          ) : (
                            // If there's no pair (odd number of entries), show empty cells
                            <>
                              <td>-</td>
                              <td>-</td>
                              <td>-</td>
                              <td>-</td>
                              <td>-</td>
                            </>
                          )}
                        </tr>
                      );
                    } else {
                      return null; // Skip odd rows as they are already included in pairs
                    }
                  })}
              </tbody>
            </table>

            </div>
          )}
        </div>
      </div>


      {/* Error Message Display */}
      {error && (
        <div style={{ marginTop: "20px", color: "red", fontWeight: "bold" }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Weather;
