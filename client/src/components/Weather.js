import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import React, { useState } from "react";
import L from "leaflet"; // Import the Leaflet library
import WeatherAlerts from './WeatherAlerts';

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

    // Function to handle map click events and update latitude & longitude
    function LocationMarker() {
        useMapEvents({
            click(e) {
                setLatitude(e.latlng.lat.toFixed(6)); // Update latitude with clicked location
                setLongitude(e.latlng.lng.toFixed(6)); // Update longitude with clicked location
            },
        });
        return latitude && longitude ? (
            <Marker position={[latitude, longitude]} icon={defaultIcon} /> // Use the custom icon
        ) : null;
    }

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
                    </MapContainer>
                </div>
                <input type="text" placeholder="Latitude" value={latitude} readOnly />
                <input type="text" placeholder="Longitude" value={longitude} readOnly />
                <button onClick={fetchWeather}>Get Weather</button>
                {weatherData && (
                    <div>
                        <p>At {weatherData.time}:</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                            <p>Temperature: {weatherData.temperature}°C</p>
                            <p>Cloudiness: {weatherData.cloudiness}%</p>
                            <p>Wind Speed: {weatherData.wind_speed} km/h {weatherData.wind_direction}</p>
                            <p>Precipitation: {weatherData.rain} mm</p>
                        </div>
                    </div>
                )}
            </div>

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