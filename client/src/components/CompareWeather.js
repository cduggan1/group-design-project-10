import React, { useState, useEffect } from "react";
import "./CompareWeather.css";
import Location from "./Location";

const CompareWeather = ({ BASE_URL }) => {
    const [compareLocations, setCompareLocations] = useState([]);
    const [weatherData, setWeatherData] = useState({}); // Use an object keyed by address
    const [newLocation, setNewLocation] = useState("");

    // When the Location component updates the location,
    // add it to the compareLocations array.
    const handleLocationUpdate = (lat, lon, address) => {
        // Prevent duplicate entries (optional)
        if (!compareLocations.find((loc) => loc.address === address)) {
            setCompareLocations((prev) => [
                ...prev,
                { latitude: lat, longitude: lon, address },
            ]);
        }
    };

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

    // Remove a location from the table and weatherData
    const removeLocation = (address) => {
        setCompareLocations((prev) =>
            prev.filter((loc) => loc.address !== address)
        );

        setWeatherData((prev) => {
            const updated = { ...prev };
            delete updated[address];
            return updated;
        });
    };
    // 1) Define a “score” function that weighs temperature, precipitation, wind, and cloudiness
    const calculateScore = (weather) => {
        // Example formula:
        // +2 per °C
        // -5 per mm precipitation
        // -0.2 per km/h wind speed
        // -0.1 per % cloudiness
        const { temperature, rain, wind_speed, cloudiness } = weather;
        return temperature * 2 - rain * 5 - wind_speed * 0.2 - cloudiness * 0.1;
    };

    // 2) Find the best city each render based on the highest “score”
    const getBestCity = () => {
        let bestCity = null;
        let bestScore = -Infinity;

        for (const loc of compareLocations) {
            const wData = weatherData[loc.address];
            if (wData && wData.length > 0) {
                const score = calculateScore(wData[0]);
                if (score > bestScore) {
                    bestScore = score;
                    // Merge location details + first weather record
                    bestCity = { ...loc, ...wData[0], score };
                }
            }
        }

        return bestCity;
    };

    const bestCity = getBestCity();

    return (
        <div style={{ padding: "20px" }}>
            {/* Wrap heading + search in a flex container */}
            <div className="compare-weather-header">
                <h2 className="compare-weather-title">Compare Weather</h2>
                <div className="compare-weather-search">
                    {/* Render the Location component as your search bar.
            Pass updateLocation prop that handles the location selection */}
                    <Location
                        updateLocation={handleLocationUpdate}
                        initialLocation={null}
                        fetchDefaultLocation={() => { }}
                        saveDefaultLocation={() => { }}
                        showHeader={false}
                        showButtons={false}
                    />

                </div>
            </div>
            {/* Score Key (explanation) */}
            <div
                style={{
                    maxWidth: "600px",
                    margin: "20px auto",
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffeeba",
                    borderRadius: "4px",
                    padding: "15px",
                }}
            >
                <h4>Score Key (Higher is Better)</h4>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    <li>+2 points for each °C of temperature</li>
                    <li>-5 points for each mm of precipitation</li>
                    <li>-0.2 points for each km/h of wind speed</li>
                    <li>-0.1 points for each % of cloudiness</li>
                </ul>
            </div>
            {/* If there's a “best city,” display it in a light-blue box */}
            {bestCity && (
                <div
                    style={{
                        backgroundColor: "#e0f0ff",
                        padding: "15px",
                        marginTop: "20px",
                        borderRadius: "4px",
                        maxWidth: "600px",
                        margin: "20px auto",
                    }}
                >
                    <h3>
                        The best city to travel to based on overall comparison is{" "}
                        {bestCity.address}
                    </h3>
                    <p>Temperature: {bestCity.temperature}°C</p>
                    <p>Cloudiness: {bestCity.cloudiness}%</p>
                    <p>
                        Wind: {bestCity.wind_speed} km/h {bestCity.wind_direction}
                    </p>
                    <p>Precipitation: {bestCity.rain} mm</p>
                    <p style={{ fontStyle: "italic" }}>
                        (Score: {bestCity.score.toFixed(2)})
                    </p>
                </div>
            )}

            {/* Weather comparison table */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
                {compareLocations.length === 0 ? (
                    <p>No locations added yet.</p>
                ) : (
                    <div className="compare-weather-container">
                        <table className="compare-weather-table">
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Temperature</th>
                                    <th>Cloudiness</th>
                                    <th>Wind</th>
                                    <th>Precipitation</th>
                                    <th>Score</th>
                                    <th>Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {compareLocations.map((loc) => {
                                    const weather = weatherData[loc.address];

                                    if (!weather) {
                                        // If weather data not loaded yet, show placeholders
                                        return (
                                            <tr key={loc.address}>
                                                <td>{loc.address}</td>
                                                <td colSpan="4">Loading...</td>
                                                <td>
                                                    <button
                                                        onClick={() => removeLocation(loc.address)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        X
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }
                                    // If weather data is loaded, display the first data entry
                                    return (
                                        <tr key={loc.address}>
                                            <td>{loc.address}</td>
                                            <td>{weather[0].temperature}°C</td>
                                            <td>{weather[0].cloudiness}%</td>
                                            <td>
                                                {weather[0].wind_speed} km/h {weather[0].wind_direction}
                                            </td>
                                            <td>{weather[0].rain} mm</td>
                                            <td>{score.toFixed(2)}</td>
                                            <td>
                                                <button
                                                    onClick={() => removeLocation(loc.address)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    X
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
export default CompareWeather;