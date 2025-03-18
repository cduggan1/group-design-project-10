import React, { useState, useEffect } from "react";

const CompareWeather = ({ BASE_URL }) => {
  const [compareLocations, setCompareLocations] = useState([]);
  const [weatherData, setWeatherData] = useState({}); // Use an object keyed by address
  const [newLocation, setNewLocation] = useState("");

  // Function to add a location after fetching its coordinates
  const addLocation = async () => {
    if (!newLocation) return;
    try {
      const response = await fetch(
        `${BASE_URL}/api/address/?address=${encodeURIComponent(newLocation)}`
      );
      if (!response.ok) throw new Error("Failed to fetch location");
      const data = await response.json();
      const loc = data[0]; // Assuming the API returns an array
      setCompareLocations((prev) => [
        ...prev,
        { latitude: loc.latitude, longitude: loc.longitude, address: loc.address },
      ]);
      setNewLocation("");
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch weather for each location whenever compareLocations changes
  useEffect(() => {
    compareLocations.forEach(async (loc) => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/weather/?lat=${loc.latitude}&lon=${loc.longitude}`
        );
        if (!response.ok) throw new Error("Failed to fetch weather");
        const data = await response.json();
        setWeatherData((prev) => ({
          ...prev,
          [loc.address]: data,
        }));
      } catch (error) {
        console.error(error);
      }
    });
  }, [compareLocations, BASE_URL]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Compare Weather</h2>
      <div>
        <input
          type="text"
          placeholder="Enter a location"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
        />
        <button onClick={addLocation}>Add Location</button>
      </div>
      <div style={{ marginTop: "20px" }}>
        {compareLocations.length === 0 ? (
          <p>No locations added yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Location</th>
                <th>Temperature</th>
                <th>Cloudiness</th>
                <th>Wind</th>
                <th>Precipitation</th>
              </tr>
            </thead>
            <tbody>
              {compareLocations.map((loc) => {
                const weather = weatherData[loc.address];
                return (
                  <tr key={loc.address}>
                    <td>{loc.address}</td>
                    {weather ? (
                      <>
                        <td>{weather[0].temperature}°C</td>
                        <td>{weather[0].cloudiness}%</td>
                        <td>
                          {weather[0].wind_speed} km/h {weather[0].wind_direction}
                        </td>
                        <td>{weather[0].rain} mm</td>
                      </>
                    ) : (
                      <td colSpan="4">Loading...</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CompareWeather;
