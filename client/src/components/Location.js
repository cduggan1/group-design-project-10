import "leaflet/dist/leaflet.css";
import React, { useState } from "react";
import L from "leaflet"; // Import the Leaflet library


const Weather = () => {
    // State variables for storing input values and fetched data
    const [latitude, setLatitude] = useState(""); // Stores latitude value
    const [longitude, setLongitude] = useState(""); // Stores longitude value
    const [weatherData, setWeatherData] = useState(null); // Stores fetched weather data
    const [address, setAddress] = useState(""); // Stores user-input address
    const [coordinates, setCoordinates] = useState(null); // Stores fetched coordinates
    const [directions, setDirections] = useState(null); // Stores fetched directions
    const [start, setStart] = useState(""); // Stores start location for directions
    const [destination, setDestination] = useState(""); // Stores destination for directions
    const [error, setError] = useState(""); // Stores error messages

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
                {coordinates && (
                    <p>At {coordinates.latitude}, {coordinates.longitude}</p>
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

export default Weather;