import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import React, { useState } from "react";
import L from "leaflet"; // Import the Leaflet library
import WeatherAlerts from './WeatherAlerts';


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

    // Function to fetch directions from start to destination
    const fetchDirections = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/directions/?from=${start}&to=${destination}`);
            if (!response.ok) {
                throw new Error("Failed to fetch directions");
            }
            const data = await response.json();
            setDirections(data); // Store the fetched directions
            setError(""); // Clear error message if successful
        } catch (err) {
            setError("Failed to fetch directions");
            setDirections(null);
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
            {/* Directions Section - Allows users to get directions between locations */}
            <div style={{ flex: 1, textAlign: "center" }}>
                <h2>Directions</h2>
                <input type="text" placeholder="From" value={start} onChange={(e) => setStart(e.target.value)} />
                <input type="text" placeholder="To" value={destination} onChange={(e) => setDestination(e.target.value)} />
                <button onClick={fetchDirections}>Get Directions</button>
                <button onClick={() => setDestination("53.377,-6.073")}>Get Directions to Howth</button>
                <button onClick={() => setDestination("53.144, -6.155")}>Get Directions to the Sugar Loaf</button>
                <button onClick={() => setDestination("53.141, -6.56")}>Get Directions to the Blessington Greenway</button>
                {directions && directions.map((direction, index) => <p key={index}>{direction}</p>)}
            </div>

            {/* Weather Alerts Section - Displays weather alerts for selected coordinates */}
            <div style={{ flex: 1, textAlign: "center" }}>
                <WeatherAlerts latitude={latitude} longitude={longitude} />
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