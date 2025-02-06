import React, { useState } from "react";

const Weather = () => {
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [weatherData, setWeatherData] = useState(null);
    const [address, setAddress] = useState("");
    const [coordinates, setCoordinates] = useState(null);
    const [error, setError] = useState("");

    const fetchWeather = async () => {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/weather/?lat=${latitude}&lon=${longitude}`);
        
        if (!response.ok) {
            throw new Error("Failed to fetch weather data");
        }
        
        const data = await response.json();
        setWeatherData(data[0]);
        setError("");
            } catch (err) {
                setError("Failed to fetch weather data");
                setWeatherData(null);
            }
    };

    const fetchCoordinates = async () => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/address/?address=${address}`);
            
            if (!response.ok) {
                throw new Error("Failed to fetch address");
            }
            
            const data = await response.json();
            setCoordinates(data[0]);
            setLatitude(data[0].latitude)
            setLongitude(data[0].longitude)
            setError("");
                } catch (err) {
                    setError("Failed to fetch weather data");
                    setCoordinates(null);
                }
        };


    return (
        <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
            
            {/* Location Section */}
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
    
            {/* Weather Section */}
            <div style={{ flex: 1, textAlign: "center" }}>
                <h2>Weather Forecast</h2>
                <input
                    type="text"
                    placeholder="Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                />
                <button onClick={fetchWeather}>Get Weather</button>
    
                {error && <p style={{ color: "red" }}>{error}</p>}
    
                {weatherData && (
                    <div>
                        <p>At {weatherData.time}:</p>
                        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                            <p>Temperature: {weatherData.temperature}°C</p>
                            <p>Cloudiness: {weatherData.cloudiness}%</p>
                            <p>Wind Speed: {weatherData.wind_speed} km/h {weatherData.wind_direction}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );      
};

export default Weather;
