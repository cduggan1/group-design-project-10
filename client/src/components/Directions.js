import React, { useState, useEffect } from "react";

const Directions = ({ latitude, longitude, trailDestination}) => {
  // State variables for storing input values and fetched data
  const BASE_URL = process.env.REACT_APP_API_URL;

  const [start, setStart] = useState(`${latitude}, ${longitude}`); // Start with the current latitude and longitude as default
  const [destination, setDestination] = useState(trailDestination || "");
  const [directions, setDirections] = useState(null); // Stores fetched directions
  const [error, setError] = useState(""); // Stores error messages


  // Fetch directions from API
  const fetchDirections = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/directions/?from=${start}&to=${destination}`);
      if (!response.ok) {
        throw new Error("Failed to fetch directions");
      }
      const data = await response.json();
      setDirections(data); // Store fetched directions
      setError(""); // Clear any error message
    } catch (err) {
      setError("Failed to fetch directions");
      setDirections(null);
    }
  };

  useEffect(() => {
    if (trailDestination) {
      setDestination(trailDestination);
    }
  }, [trailDestination]);
  

  // Effect to update start location if latitude and longitude props change
  useEffect(() => {
    setStart(`${latitude}, ${longitude}`); // Update start location with current latitude and longitude
  }, [latitude, longitude]);

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
      <div style={{ flex: 1, textAlign: "center" }}>
        <h2>Directions</h2>

        {/* "From" Location input */}
        <input
          type="text"
          placeholder="From (latitude, longitude)"
          value={start}
          onChange={(e) => setStart(e.target.value)} // Handle changes in start location
        />

        {/* "To" Location input */}
        <input
          type="text"
          placeholder="To (latitude, longitude)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)} // Handle changes in destination
        />

        {/* Fetch directions when clicked */}
        <button onClick={fetchDirections}>Get Directions</button>

        {/* Predefined destinations */}
        <button onClick={() => setDestination("53.377,-6.073")}>Get Directions to Howth</button>
        <button onClick={() => setDestination("53.144, -6.155")}>Get Directions to the Sugar Loaf</button>
        <button onClick={() => setDestination("53.141, -6.56")}>Get Directions to the Blessington Greenway</button>

        {/* Display directions if available */}
        {directions && directions.length > 0 && (
          <div>
            {directions.map((direction, index) => (
              <p key={index}>{direction}</p>
            ))}
          </div>
        )}
      </div>

      {/* Error message display */}
      {error && (
        <div style={{ position: "absolute", bottom: "20px", left: "20px", color: "red" }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Directions;
