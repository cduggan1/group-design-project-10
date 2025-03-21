import React, { useState, useEffect } from 'react';

const WeatherAlerts = ({ latitude, longitude }) => {
    const [alerts, setAlerts] = useState([]);
    const BASE_URL = process.env.REACT_APP_API_URL;
    const fetchAlerts = async () => {
        try {
            const response = await fetch(
                `${BASE_URL}/api/weather-alerts/?lat=${latitude}&lon=${longitude}`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch alerts");
            }
            const data = await response.json();
            setAlerts(data);
        } catch (err) {
            console.error("Error fetching alerts:", err);
        }
    };
    
    useEffect(() => {
        if (latitude && longitude) {
            fetchAlerts();
            // Refresh alerts every 5 minutes
            const interval = setInterval(fetchAlerts, 300000);
            return () => clearInterval(interval);
        }
    }, [latitude, longitude]);
    
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'LOW': return '#FFF176';
            case 'MODERATE': return '#FFA726';
            case 'SEVERE': return '#EF5350';
            case 'EXTREME': return '#880E4F';
            default: return '#000000';
        }
    };
    
    return (
        <div className="weather-alerts">
            {alerts.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h2>Weather Alerts</h2>
                    {alerts.map((alert, index) => (
                        <div
                            key={index}
                            style={{
                                backgroundColor: getSeverityColor(alert.severity),
                                padding: '10px',
                                margin: '5px 0',
                                borderRadius: '4px',
                                color: alert.severity === 'EXTREME' ? 'white' : 'black'
                            }}
                        >
                            <h4>{alert.title}</h4>
                            <p>{alert.description}</p>
                            <small>
                                Valid: {new Date(alert.start_time).toLocaleString()} - 
                                {new Date(alert.end_time).toLocaleString()}
                            </small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WeatherAlerts; 