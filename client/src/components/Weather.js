import { MapContainer, TileLayer, Marker, useMapEvents, Polyline} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import React, { useState} from "react";
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
  const [solarData, setSolarData] = useState(null);
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
  
const Weather = () => {
    // State variables for storing input values and fetched data
    const [latitude, setLatitude] = useState(""); // Stores latitude value
    const [longitude, setLongitude] = useState(""); // Stores longitude value
    const [weatherData, setWeatherData] = useState(null); // Stores fetched weather data
    const [trails, setTrails] = useState(null); // Stores fetched weather data
    const [topTrails, setTopTrails] = useState(null); // Stores fetched weather data
    const [address, setAddress] = useState(""); // Stores user-input address
    const [coordinates, setCoordinates] = useState(null); // Stores fetched coordinates
    const [directions, setDirections] = useState(null); // Stores fetched directions
    const [start, setStart] = useState(""); // Stores start location for directions
    const [destination, setDestination] = useState(""); // Stores destination for directions
    const [error, setError] = useState(""); // Stores error messages

    // Function to fetch weather data based on latitude and longitude
    const fetchWeather = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/weather/?lat=${latitude}&lon=${longitude}`);
            if (!response.ok) {
                throw new Error("Failed to fetch weather data");
            }
            const data = await response.json();
            setWeatherData(data[0]); // Store the fetched weather data
            setError(""); // Clear error message if successful
        } catch (err) {
            setError("Failed to fetch weather data");
            setWeatherData(null);
        }
    };

    const fetchAllTrails = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/activities/trails/all`);
            if (!response.ok) {
                throw new Error("Failed to fetch trail data");
            }
            const data = await response.json();
            setTrails(data); // Store the fetched weather data
            setError(""); // Clear error message if successful
        } catch (err) {
            setError("Failed to fetch trail data");
            setTrails(null);
        }
    };

    const fetchTopTrails = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/activities/trails/top/?lat=${latitude}&lon=${longitude}`);
            if (!response.ok) {
                throw new Error("Failed to fetch trail data");
            }
            const data = await response.json();
            setTopTrails(data); // Store the fetched weather data
            setError(""); // Clear error message if successful
        } catch (err) {
            setError("Failed to fetch trail data");
            setTopTrails(null);
        }
    };

    // Function to fetch coordinates from an address
    const fetchCoordinates = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/address/?address=${address}`);
            if (!response.ok) {
                throw new Error("Failed to fetch address");
            }
            const data = await response.json();
            setCoordinates(data[0]); // Store the fetched coordinates
            setLatitude(data[0].latitude); // Update latitude state
            setLongitude(data[0].longitude); // Update longitude state
            setStart(`${data[0].latitude}, ${data[0].longitude}`); // Update start location
            setError(""); // Clear error message if successful
        } catch (err) {
            setError("Failed to fetch coordinates");
            setCoordinates(null);
        }
    };


  const fetchSolar = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/solar/?lat=${latitude}&lon=${longitude}`);
      if (!response.ok) {
        throw new Error("Failed to fetch solar data");
      }
      const data = await response.json();
      setSolarData(data);
      console.log("Solar Data!")
      setError("");
    } catch (err) {
      setError("Failed to fetch solar data");
      setSolarData(null);
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

     <button onClick={fetchAllTrails}>Get Trails</button>
              {trails && (
              <div>
                  <div>
                      {trails.features.map((trail, index) => (
                          <p key={index}>{trail.properties.name}</p>
                      ))}
                  </div>
              </div>
              )}

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
              
             {/* Map Trail Routes */}
                        {topTrails && topTrails.features.map((trail, index) => {
                            const polylineCoords = trail.geometry.coordinates.map(([lng, lat]) => [lat, lng]); // Convert to Leaflet format

                            return (
                                <Polyline key={index} positions={polylineCoords} color="blue" weight={5}>
                                </Polyline>
                            );
                        })}
        </MapContainer>
        
      </div>
      <div>
        <input type="text" placeholder="Latitude" value={latitude} readOnly />
        <input type="text" placeholder="Longitude" value={longitude} readOnly />
        <button onClick={() => { fetchSolar(); fetchWeather();}}>Get Weather</button>
                             <button onClick={fetchTopTrails}>Get Trails</button>

      {topTrails && (
                <div>
                    <div>
                        {topTrails.features.map((trail, index) => (
                            <p key={index}>{trail.properties.name}</p>
                        ))}
                    </div>
                </div>
                )}

      </div>
      {weatherData && solarData &&
      <>
        <div>At {weatherData[0].time}</div>
        <table style={{textAlign: "center", width: "100%"}}>
          <tbody>
              <tr>
                <td>Temperature</td>
                <td>Cloudiness</td>
                <td>Wind</td>
                <td>Precipitation</td>
              </tr>
              <tr>
                <td>{weatherData[0].temperature}°C</td>
                <td>{weatherData[0].cloudiness}%</td>
                <td>{weatherData[0].wind_speed} km/h {weatherData[0].wind_direction}</td>
                <td>{weatherData[0].rain} mm</td>
              </tr>
          </tbody>
        </table>
        <hr/>
        <table style={{textAlign: "center", width: "100%"}}>
          <tbody>
              <tr>
                <td>Sunrise</td>
                <td>Sunset</td>
              </tr>
              <tr>
                <td>{solarData.rise}</td>
                <td>{solarData.set}</td>
              </tr>
          </tbody>
        </table>
      </>
      }

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
                        <td>{data.wind_speed} km/h {data.wind_direction}</td>
                        <td>{data.rain} mm</td>

                        {nextData ? (
                          <>
                            <td style={{ borderLeft: '3px solid black' }}>{nextData.time}</td>
                            <td>{nextData.temperature}°C</td>
                            <td>{nextData.cloudiness}%</td>
                            <td>{nextData.wind_speed} km/h {nextData.wind_direction}</td>
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
