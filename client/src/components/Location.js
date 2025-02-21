import React, { useState, useEffect } from "react";

const Location = ({ updateLocation, initialLocation }) => {
  // State variables for storing input values and fetched data
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [query_address, setQueryAddress] = useState(""); // Stores user-input address
  const [location, setLocation] = useState(initialLocation || null); // Stores fetched coordinates
  const [error, setError] = useState(""); // Stores error messages

  // Effect to set the initial coordinates from the parent component
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation); // Set the coordinates if passed from the parent
    }
  }, [initialLocation]);

  // Function to fetch coordinates from an address
  const fetchCoordinates = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/address/?address=${query_address}`);
      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }
      const data = await response.json();
      setLocation(data[0]); // Store the fetched coordinates
      setError(""); // Clear error message if successful

      // Update latitude and longitude in parent component
      updateLocation(data[0].latitude, data[0].longitude, data[0].address); // Pass coordinates to parent component
    } catch (err) {
      setError("Failed to fetch coordinates");
      setLocation(null);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
      {/* Location Section - Allows users to input an address and fetch its coordinates */}
      <div style={{ flex: 1, textAlign: "center" }}>
        <h2>Set Location</h2>
        <input
          type="text"
          placeholder="Address"
          value={query_address}
          onChange={(e) => setQueryAddress(e.target.value)}
        />
        <button onClick={fetchCoordinates}>Get Coordinates</button>

        {/* Display coordinates if set */}
        {location ? (
          <p>Current location: {location.address}<br />{location.latitude}, {location.longitude}</p>
        ) : (
          <p>No location set</p>
        )}
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

export default Location;
