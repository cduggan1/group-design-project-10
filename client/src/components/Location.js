import React, { useState, useEffect } from "react";

const Location = ({ updateLocation, initialCoordinates }) => {
  // State variables for storing input values and fetched data
  const [address, setAddress] = useState(""); // Stores user-input address
  const [coordinates, setCoordinates] = useState(initialCoordinates || null); // Stores fetched coordinates
  const [error, setError] = useState(""); // Stores error messages

  // Effect to set the initial coordinates from the parent component
  useEffect(() => {
    if (initialCoordinates) {
      setCoordinates(initialCoordinates); // Set the coordinates if passed from the parent
    }
  }, [initialCoordinates]);

  // Function to fetch coordinates from an address
  const fetchCoordinates = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/address/?address=${address}`);
      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }
      const data = await response.json();
      setCoordinates(data[0]); // Store the fetched coordinates
      setError(""); // Clear error message if successful

      // Update latitude and longitude in parent component
      updateLocation(data[0].latitude, data[0].longitude); // Pass coordinates to parent component
    } catch (err) {
      setError("Failed to fetch coordinates");
      setCoordinates(null);
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
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button onClick={fetchCoordinates}>Get Coordinates</button>

        {/* Display coordinates if set */}
        {coordinates ? (
          <p>At {coordinates.latitude}, {coordinates.longitude}</p>
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
