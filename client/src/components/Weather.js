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
import TrailWeatherPreferences, { getExclusionReason } from "./TrailWeatherPreferences";


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

  function getWeatherSeverity(weather) {
    const { temperature, wind_speed, rain } = weather;
  
    if (temperature < 5 || temperature > 30 || wind_speed > 30 || rain > 5) {
      return "high";
    } else if (
      (temperature >= 5 && temperature < 15) ||
      (temperature > 25 && temperature <= 30) ||
      (wind_speed >= 15 && wind_speed <= 30) ||
      (rain >= 1 && rain <= 5)
    ) {
      return "moderate";
    } else {
      return "low";
    }
  }

  function getAverageSeverity(segments) {
    if (!segments || segments.length === 0) return "low";
    let severityCounts = { low: 0, moderate: 0, high: 0 };

    segments.forEach(segment => {
      const severity = getWeatherSeverity(segment.weather);
      severityCounts[severity]++;
    });
  
    const total = segments.length;
    const highRatio = severityCounts.high / total;
    const moderateRatio = severityCounts.moderate / total;
  
    if (highRatio > 0.4) return "high";
    if (moderateRatio > 0.3 || highRatio > 0.2) return "moderate";
    return "low";
  }
  
  
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
      <div style={{ 
        width: "100%", 
        textAlign: "center", 
        marginBottom: "20px" 
        }}>

        <WeatherAlerts latitude={latitude} longitude={longitude} />
      </div>

      {/* Add User Weather Alerts below official alerts */}
      <div style ={{
        width: "100%", 
        display: "flex", 
        justifyContent: "center", 
        marginBottom: "20px",
        gap: "20px"
        }}  
      >

        <div style={{ 
          width: "fit-content", 
          textAlign: "center"
          }}
        >
            <UserWeatherAlerts weatherData={weatherData} latitude={latitude} longitude={longitude} />
        </div>

        <div style={{ 
          width: "fit-content", 
          textAlign: "left"
          }}
        >
          <TrailWeatherPreferences onChange={setPreferences} />
        </div>
      </div>

 {/* LEFT COLUMN: Weather Overview + Trails */}
<div style={{ flex: 1, minWidth: "100%", textAlign:"center" }}>
  <h2 style={{ textAlign: "center" }}>Weather Forecast</h2>

  {/* Map */}
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
      {topCycleTrails &&
        topCycleTrails.features.map((trail, index) => {
          const polylineCoords = trail.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
          );
          return (
            <Polyline
              key={index}
              positions={polylineCoords}
              color="blue"
              weight={5}
            />
          );
        })}
      {topWalkingTrails &&
        topWalkingTrails.features.map((trail, index) => {
          const polylineCoords = trail.geometry.coordinates.map(
            ([lng, lat]) => [lat, lng]
          );
          return (
            <Polyline
              key={index}
              positions={polylineCoords}
              color="red"
              weight={5}
            />
          );
        })}
    </MapContainer>
  </div>

  {/* Location Inputs + Buttons */}
  <div style={{ textAlign: "center", marginBottom: "20px" }}>
    <input type="text" value={latitude} readOnly />
    <input type="text" value={longitude} readOnly />
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
    <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
      <button className="btn-add-alert" onClick={() => { fetchSolar(); fetchWeather(); }}>
        Get Weather at Your Location
      </button>
      <button className="btn-add-alert" onClick={() => { handleFetchCyclingTrails(); fetchTrailWeather("Cycling"); }} disabled={isLoading}>
        {isLoading ? "Loading..." : "Get Cycling Trails"}
      </button>
      <button className="btn-add-alert" onClick={() => { handleFetchWalkingTrails(); fetchTrailWeather("Walking"); }} disabled={isLoading}>
        {isLoading ? "Loading..." : "Get Walking Trails"}
      </button>
    </div>
  </div>
   {/*WRAPPER FLEX - TWO COLUMN LAYOUT */}
   <div
        style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            alignItems: "flex-start",
            gap: "30px",
        }}
      >
  {/* Weather + Trails Wrap (no gap here!) */}
  {weatherData && solarData && (
    <div style={{ display: "flex", textAlign: "center", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2>Current Weather</h2>
        <table style={{ width: "100%", textAlign: "center", borderCollapse: "collapse" }}>
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
        <hr style={{ margin: "10px 0" }} />
      </div>

      <div>
        <h2>Sun Times</h2>
        <table style={{ width: "100%", textAlign: "center", borderCollapse: "collapse" }}>
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
    </div>
  )}

  <div style={{ display: "flex", justifyContent: "space-evenly", gap: "12px" }}>

  {/* Trails Section */}
  {topCycleTrails && trailWeather && (
    <div style={{ margin: "20px 0", padding: "15px", border: "1px solid #ddd", borderRadius: "6px" }}>

    <div>
      <h2>Cycling Trail Weather</h2>
      <div style={{ display: "flex", gap: "10px", margin: "10px 0", justifyContent: "center" }}>
        <div className="weather-severity-low" style={{ padding: "5px 10px", borderRadius: "4px" }}>Low</div>
        <div className="weather-severity-moderate" style={{ padding: "5px 10px", borderRadius: "4px" }}>Moderate</div>
        <div className="weather-severity-high" style={{ padding: "5px 10px", borderRadius: "4px" }}>High</div>
      </div>
      <div style={{ textAlign:"left" }}>
      {topCycleTrails.features.map((trail, index) => {
        const segment = trailWeather.features[index]?.properties?.segments[0];
        const reason = preferences ? getExclusionReason(segment.weather, preferences) : null;
        const excluded = !!reason;

        return (
          <details key={index} style={{ marginBottom: "10px" }}>
            <summary>
              <div>
                <strong>{trail.properties.name}</strong>
                <div className={`severity-bar ${getAverageSeverity(
                  trailWeather.features[index]?.properties?.segments
                )}`}></div>
              </div>
              {excluded && (
                <span style={{ color: "red", marginLeft: "10px" }}>
                  — {reason}
                </span>
              )}
            </summary>
            <button className="btn-add-alert" onClick={() =>
              updateDestination(
                `${trail.geometry.coordinates[0][1]}, ${trail.geometry.coordinates[0][0]}`
              )
            }>
              Set Destination
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
                        
                        const severity = getWeatherSeverity(segment.weather);
                        
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
                              <tr className={`weather-severity-${severity}`}>                                  <th>{formattedTime}:</th>
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
        );
      })}</div>          
      </div>
    </div>
  )}

  {topWalkingTrails && trailWeather && (
    <div style={{ margin: "20px 0", padding: "15px", border: "1px solid #ddd", borderRadius: "6px" }}>
      <h2>Walking Trail Weather</h2>
      <div style={{ display: "flex", gap: "10px", margin: "10px 0", justifyContent: "center" }}>
        <div className="weather-severity-low" style={{ padding: "5px 10px", borderRadius: "4px" }}>Low</div>
        <div className="weather-severity-moderate" style={{ padding: "5px 10px", borderRadius: "4px" }}>Moderate</div>
        <div className="weather-severity-high" style={{ padding: "5px 10px", borderRadius: "4px" }}>High</div>
      </div>
      <div style={{ textAlign:"left" }}>

      {topWalkingTrails.features.map((trail, index) => {
        const segment = trailWeather.features[index]?.properties?.segments[0];
        const reason = preferences ? getExclusionReason(segment.weather, preferences) : null;
        const excluded = !!reason;

        return (
          <details key={index} style={{ marginBottom: "10px" }}>
            <summary>
              <div>
                <strong>{trail.properties.name}</strong>
                <div className={`severity-bar ${getAverageSeverity(
                  trailWeather.features[index]?.properties?.segments
                )}`}></div>
              </div>
              {excluded && (
                <span style={{ color: "red", marginLeft: "10px" }}>
                  — {reason}
                </span>
              )}
            </summary>
            <button className="btn-add-alert" onClick={() =>
              updateDestination(
                `${trail.geometry.coordinates[0][1]}, ${trail.geometry.coordinates[0][0]}`
              )
            }>
              Set Destination
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
                        
                        const severity = getWeatherSeverity(segment.weather);
                        
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
                              <tr className={`weather-severity-${severity}`}>                                  <th>{formattedTime}:</th>
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
        );
      })}
    </div>
    </div>
  )}
  </div>

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
  </div>
  );
};

export default Weather;
