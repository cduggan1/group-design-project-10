import React, { useState } from "react";

const Weather = () => {
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState("");

    const fetchWeather = async () => {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/weather/?lat=${latitude}&lon=${longitude}`);
        
        if (!response.ok) {
            throw new Error("Failed to fetch weather data");
        }
        
        const data = await response.json();
        console.log(response)
        setWeatherData(data[0]);  // Use first set of weather data
        setError("");
            } catch (err) {
                setError("Failed to fetch weather data");
                setWeatherData(null);
            }
    };


    return (
        <div>
            <h2>Weather Information</h2>
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
                    <p>Temperature: {weatherData.temperature}°C</p>
                    <p>Cloudiness: {weatherData.cloudiness}%</p>
                    <p>Wind Speed: {weatherData.wind_speed} km/h</p>
                </div>
            )}
        </div>
    );
};

export default Weather;
