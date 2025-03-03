import React, { useState, useEffect } from "react";

const Directions = ({ latitude, longitude, trailAdr }) => {
  // Base API URL from environment variables
  const BASE_URL = process.env.REACT_APP_API_URL;

  // State variables to manage the input values and fetched directions
  const [start, setStart] = useState(`${latitude}, ${longitude}`); // Initial start location based on current coordinates
  const [destination, setDestination] = useState(`${trailAdr}`); // Initial destination (trail address)
  const [directions, setDirections] = useState(null); // Stores fetched directions data
  const [error, setError] = useState(""); // Stores error messages

  // Function to fetch directions from the API
  const fetchDirections = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/directions/?from=${start}&to=${destination}`);
      if (!response.ok) {
        throw new Error("Failed to fetch directions");
      }
      const data = await response.json();
      setDirections(data); // Store fetched directions
      setError(""); // Clear any previous error messages
    } catch (err) {
      setError("Failed to fetch directions"); // Display error if the request fails
      setDirections(null); // Clear directions data on failure
    }
  };

  useEffect(() => {setDestination(`${trailAdr}`)});

  // Effect to update the start location if the latitude or longitude props change
  useEffect(() => {
    setStart(`${latitude}, ${longitude}`);
  }, [latitude, longitude]);

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
      <div style={{ flex: 1, textAlign: "center" }}>
        <h2>Directions</h2>

        {/* Input field for "From" location */}
        <input
          type="text"
          placeholder="From (latitude, longitude)"
          value={start}
          onChange={(e) => setStart(e.target.value)} // Update start location based on user input
        />

        {/* Input field for "To" location */}
        <input
          type="text"
          placeholder="To (latitude, longitude)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)} // Update destination based on user input
        />

        {/* Button to fetch directions */}
        <button onClick={fetchDirections}>Get Directions</button>

        {/* Predefined destinations (commented out but can be used for quick access) */}
        {/* 
        <button onClick={() => setDestination("53.377,-6.073")}>Get Directions to Howth</button>
        <button onClick={() => setDestination("53.144, -6.155")}>Get Directions to the Sugar Loaf</button>
        <button onClick={() => setDestination("53.141, -6.56")}>Get Directions to the Blessington Greenway</button>
        */}

        {/* Display directions if available */}
        {directions && directions.length > 0 && (
          <div>
            {directions.map((direction, index) => (
              <p key={index}>{direction}</p> // Display each step of the directions
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
