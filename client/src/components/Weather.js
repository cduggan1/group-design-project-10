import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import React, { useState, useEffect } from "react";
import L from "leaflet"; // Import the Leaflet library
import WeatherAlerts from "./WeatherAlerts";
import UserWeatherAlerts from './UserWeatherAlerts';
import "./Weather.css";
import TrailWeatherPreferences from "./TrailWeatherPreferences";


// Fix for default icon not displaying in React-Leaflet
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const Weather = ({
  latitude: initialLat,
  longitude: initialLon,
  updateDestination,
}) => {
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLon);
  const [weatherData, setWeatherData] = useState(null);
  const [solarData, setSolarData] = useState(null);
  const [error, setError] = useState("");
  const [trails, setTrails] = useState(null);
  const [trailWeather, setTrailWeather] = useState(null);
  const [topTrails, setTopTrails] = useState(null);
  const [topCycleTrails, setTopCycleTrails] = useState(null);
  const [topWalkingTrails, setTopWalkingTrails] = useState(null);
  const [maxDistance, setMaxDistance] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState(null);


  useEffect(() => {
    if (initialLat && initialLon) {
      setLatitude(initialLat);
      setLongitude(initialLon);
    }
  }, [initialLat, initialLon]);

  const now = new Date();
  const localTime = new Date(now.getTime() + 3600000)
    .toISOString()
    .split(".")[0];
  console.log(localTime);

  // Function to fetch weather data based on latitude and longitude
  const fetchWeather = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/weather/?lat=${latitude}&lon=${longitude}`
      );
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

  const fetchTrailWeather = async (activity) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/activities/trails/top/weather-segments/?lat=${latitude}&lon=${longitude}&datetime=${localTime}&activity_type=${activity}&max_distance=${maxDistance}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch trail weather data");
      }
      const data = await response.json();
      setTrailWeather(data); // Store the fetched weather data
      setError(""); // Clear error message if successful
    } catch (err) {
      setError("Failed to fetch trail weather data");
      setTopTrails(null);
    }
  };

  const fetchAllTrails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/activities/trails/all`);
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

  const fetchTopCycleTrails = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/activities/trails/top/cycles/?lat=${latitude}&lon=${longitude}&max_distance=${maxDistance}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch cycle trail data");
      }
      const data = await response.json();
      setTopCycleTrails(data); // Store the fetched weather data
      setError(""); // Clear error message if successful
    } catch (err) {
      setError("Failed to fetch cycle trail data");
      setTopCycleTrails(null);
    }
  };

  const fetchTopWalkingTrails = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/activities/trails/top/walks/?lat=${latitude}&lon=${longitude}&max_distance=${maxDistance}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch walking trail data");
      }
      const data = await response.json();
      setTopWalkingTrails(data); // Store the fetched weather data
      setError(""); // Clear error message if successful
    } catch (err) {
      setError("Failed to fetch walking trail data");
      setTopWalkingTrails(null);
    }
  };

  const fetchTopTrails = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/activities/trails/top/?lat=${latitude}&lon=${longitude}`
      );
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

  const handleFetchCyclingTrails = async () => {
    setIsLoading(true);
    await Promise.all([fetchTopCycleTrails(), fetchTrailWeather("Cycling")]);
    setIsLoading(false);
  };

  const handleFetchWalkingTrails = async () => {
    setIsLoading(true);
    await Promise.all([fetchTopWalkingTrails(), fetchTrailWeather("Walking")]);
    setIsLoading(false);
  };

  const fetchSolar = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/solar/?lat=${latitude}&lon=${longitude}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch solar data");
      }
      const data = await response.json();
      setSolarData(data);
      console.log("Solar Data!");
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
    return latitude && longitude ? (
      <Marker position={[latitude, longitude]} icon={defaultIcon} />
    ) : null;
  }
  const renderFilteredTrails = (trailSet, title) => {
    if (!trailSet || !trailWeather || !preferences) return null;

    return (
      <div style={{ flex: 1 }}>
        <h2>{title}</h2>
        {trailSet.features.map((trail, index) => {
          const segment = trailWeather.features[index]?.properties?.segments[0];
          if (!segment) return null;

          const reason = getExclusionReason(segment.weather, preferences);
          const excluded = reason !== null;

          return (
            <details key={index} style={{ marginBottom: "10px", opacity: excluded ? 0.4 : 1 }}>
              <summary>
                {trail.properties.name}
                {excluded && <span style={{ color: "red", marginLeft: "10px" }}>— {reason}</span>}
              </summary>
              <button
                onClick={() =>
                  updateDestination(
                    `${trail.geometry.coordinates[0][1]}, ${trail.geometry.coordinates[0][0]}`
                  )
                }
              >
                Set as destination
              </button>
              <div style={{ paddingLeft: "20px" }}>
                If starting the trail in an hour:
                <div>
                  {trailWeather.features[index].properties.segments.map((segment, segmentIndex) => {
                    const date = new Date(segment.weather.forecast_time);
                    const formattedTime = date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    }).replace(":00", "");

                    return (
                      <div key={segmentIndex + 1}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            <tr>
                              <th>{formattedTime}:</th>
                              <th>{segment.weather.rain}mm precipitation</th>
                              <th>{segment.weather.temperature}°C</th>
                              <th>{segment.weather.cloudiness}% cloud cover</th>
                              <th>{segment.weather.wind_speed}km/h {segment.weather.wind_direction}</th>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
      }}
    >
      {/* Weather Alerts Section - Now at the top */}
      <div style={{ width: "100%", textAlign: "center", marginBottom: "20px" }}>
        <WeatherAlerts latitude={latitude} longitude={longitude} />
      </div>
      
      {/* Add User Weather Alerts below official alerts */}
      <div style={{ width: "100%", textAlign: "center", marginBottom: "20px" }}>
        <UserWeatherAlerts weatherData={weatherData} latitude={latitude} longitude={longitude} />
      </div>

      <div style={{ width: "100%", textAlign: "center", marginBottom: "20px" }}>
        <TrailWeatherPreferences onChange={setPreferences} />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          gap: "30px",
        }}
      >
        {/* Weather Section - Displays weather forecast for selected coordinates */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <h2>Weather Forecast</h2>
          {/* Map Section */}
          <div style={{ height: "300px", width: "100%", marginBottom: "10px" }}>
            <MapContainer
              center={[53.49, -7.562]}
              zoom={7}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker />

              {/* Map Trail Routes */}
              {topCycleTrails &&
                topCycleTrails.features.map((trail, index) => {
                  const polylineCoords = trail.geometry.coordinates.map(
                    ([lng, lat]) => [lat, lng]
                  ); // Convert to Leaflet format

                  return (
                    <Polyline                     key={index}
                      positions={polylineCoords}
                      color="blue"
                      weight={5}
                    ></Polyline>
                  );
                })}

              {topWalkingTrails &&
                topWalkingTrails.features.map((trail, index) => {
                  const polylineCoords = trail.geometry.coordinates.map(
                    ([lng, lat]) => [lat, lng]
                  ); // Convert to Leaflet format

                  return (
                    <Polyline
                      key={index}
                      positions={polylineCoords}
                      color="red"
                      weight={5}
                    ></Polyline>
                  );
                })}
            </MapContainer>
          </div>

          <div>
            <input
              type="text"
              placeholder="Latitude"
              value={latitude}
              readOnly
            />
            <input
              type="text"
              placeholder="Longitude"
              value={longitude}
              readOnly
            />
            <div style={{ margin: "10px 0" }}>
              <label>
                Max Distance (km):&nbsp;
                <input
                  type="number"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  style={{ width: "80px" }}
                />
              </label>
            </div>
            <button
              onClick={() => {
                fetchSolar();
                fetchWeather();
              }}
            >
              Get Weather at your location
            </button>
            <button
              onClick={() => {
                handleFetchCyclingTrails();
                fetchTrailWeather("Cycling");
              }}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Get cycling Trails"}
            </button>
            <button
              onClick={() => {
                handleFetchWalkingTrails();
                fetchTrailWeather("Walking");
              }}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Get walking Trails"}
            </button>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "30px",
              }}
            >
              {/* Left Side - Weather and Solar Data */}
              {weatherData && solarData && (
                <div style={{ flex: 1 }}>
                  <h2>Current Weather</h2>
                  <table
                    style={{
                      textAlign: "center",
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
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
                        <td>
                          {weatherData[0].wind_speed} km/h{" "}
                          {weatherData[0].wind_direction}
                        </td>
                        <td>{weatherData[0].rain} mm</td>
                      </tr>
                    </tbody>
                  </table>
                  <hr />
                  <h2>Sun Times</h2>
                  <table
                    style={{
                      textAlign: "center",
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td>Sunrise</td>
                        <td>Sunset</td>
                      </tr>
                      <tr>
                        <td>{solarData[0].rise}</td>
                        <td>{solarData[0].set}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Right Side - Trail Weather */}
              {topCycleTrails && trailWeather && (
                <div style={{ flex: 1 }}>
                  <div>
                    <h2>Trail Weather</h2>
                    {topCycleTrails.features.map((trail, index) => (
                      <details key={index} style={{ marginBottom: "10px" }}>
                        <summary>{trail.properties.name}</summary>
                        <button
                          onClick={() =>
                            updateDestination(
                              `${trail.geometry.coordinates[0][1]}, ${trail.geometry.coordinates[0][0]}`
                            )
                          }
                        >
                          Set as destination
                        </button>
                        <div style={{ paddingLeft: "20px" }}>
                          If starting the trail in an hour:
                          <div
                            style={{ listStyleType: "none", paddingLeft: "0" }}
                          >
                            {trailWeather.features[
                              index
                            ].properties.segments.map(
                              (segment, segmentIndex) => {
                                const isoString = segment.weather.forecast_time;
                                const date = new Date(isoString);
                                const timeString = date.toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "numeric",
                                    hour12: true,
                                  }
                                );
                                const formattedTime = timeString.replace(
                                  ":00",
                                  ""
                                );

                                return (
                                  <div key={segmentIndex + 1}>
                                    <table
                                      align="center"
                                      style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                      }}
                                    >
                                      <tbody>
                                        <tr>
                                          <th>{formattedTime}:</th>
                                          <th>
                                            {segment.weather.rain}mm
                                            precipitation
                                          </th>
                                          <th>
                                            {segment.weather.temperature}°C
                                          </th>
                                          <th>
                                            {segment.weather.cloudiness}% cloud
                                            cover
                                          </th>
                                          <th>
                                            {segment.weather.wind_speed}km/h{" "}
                                            {segment.weather.wind_direction}
                                          </th>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {topWalkingTrails && trailWeather && (
                <div style={{ flex: 1 }}>
                  <div>
                    <h2>Trail Weather</h2>
                    {topWalkingTrails.features.map((trail, index) => (
                      <details key={index} style={{ marginBottom: "10px" }}>
                        <summary>{trail.properties.name}</summary>
                        <button
                          onClick={() =>
                            updateDestination(
                              `${trail.geometry.coordinates[0][1]}, ${trail.geometry.coordinates[0][0]}`
                            )
                          }
                        >
                          Set as destination
                        </button>
                        <div style={{ paddingLeft: "20px" }}>
                          If starting the trail in an hour:
                          <div
                            style={{ listStyleType: "none", paddingLeft: "0" }}
                          >
                            {trailWeather.features[
                              index
                            ].properties.segments.map(
                              (segment, segmentIndex) => {
                                const isoString = segment.weather.forecast_time;
                                const date = new Date(isoString);
                                const timeString = date.toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "numeric",
                                    hour12: true,
                                  }
                                );
                                const formattedTime = timeString.replace(
                                  ":00",
                                  ""
                                );

                                return (
                                  <div key={segmentIndex + 1}>
                                    <table
                                      align="center"
                                      style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                      }}
                                    >
                                      <tbody>
                                        <tr>
                                          <th>{formattedTime}:</th>
                                          <th>
                                            {segment.weather.rain}mm
                                            precipitation
                                          </th>
                                          <th>
                                            {segment.weather.temperature}°C
                                          </th>
                                          <th>
                                            {segment.weather.cloudiness}% cloud
                                            cover
                                          </th>
                                          <th>
                                            {segment.weather.wind_speed}km/h{" "}
                                            {segment.weather.wind_direction}
                                          </th>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
                    <th style={{ borderLeft: "3px solid black" }}>Time</th>
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
                            <td>
                              {data.wind_speed} km/h {data.wind_direction}
                            </td>
                            <td>{data.rain} mm</td>

                            {nextData ? (
                              <>
                                <td style={{ borderLeft: "3px solid black" }}>
                                  {nextData.time}
                                </td>
                                <td>{nextData.temperature}°C</td>
                                <td>{nextData.cloudiness}%</td>
                                <td>
                                  {nextData.wind_speed} km/h{" "}
                                  {nextData.wind_direction}
                                </td>
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
