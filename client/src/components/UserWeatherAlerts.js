import React, { useState, useEffect } from 'react';
import './UserWeatherAlerts.css';

const UserWeatherAlerts = ({ weatherData, latitude, longitude }) => {
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [alerts, setAlerts] = useState([]);
  const [matchedAlerts, setMatchedAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    condition: 'SUNNY',
    threshold: 70,
    comparison: 'GT'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUserAlerts = async () => {
    try {
      setError('');
      const response = await fetch(`${BASE_URL}/api/user-weather-alerts/`);
      if (!response.ok) {
        if (response.status === 500) {
          throw new Error("Database migration needed. Please contact an administrator.");
        }
        throw new Error("Failed to fetch user alerts");
      }
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError("Error fetching user alerts: " + err.message);
    }
  };

  const checkAlertConditions = async () => {
    if (!weatherData || !weatherData.length) return;

    try {
      const response = await fetch(`${BASE_URL}/api/user-weather-alerts/check/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weather_data: weatherData }),
      });

      if (!response.ok) {
        throw new Error("Failed to check alerts");
      }
      
      const data = await response.json();
      setMatchedAlerts(data.matched_alerts || []);
    } catch (err) {
      setError("Error checking alert conditions: " + err.message);
    }
  };

  useEffect(() => {
    fetchUserAlerts();
  }, []);

  useEffect(() => {
    if (weatherData && weatherData.length > 0) {
      checkAlertConditions();
    }
  }, [weatherData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAlert({
      ...newAlert,
      [name]: value
    });
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    
    try {
      const alertData = {
        ...newAlert,
        latitude: latitude,
        longitude: longitude
      };
      
      const response = await fetch(`${BASE_URL}/api/user-weather-alerts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error("Failed to create alert");
      }
      
      setNewAlert({
        name: '',
        condition: 'SUNNY',
        threshold: 70,
        comparison: 'GT'
      });
      setShowForm(false);
      setSuccess("Alert created successfully!");
      
      setTimeout(() => setSuccess(''), 3000);
      
      fetchUserAlerts();
    } catch (err) {
      setError("Error creating alert: " + err.message);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/api/user-weather-alerts/${id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }
      
      fetchUserAlerts();
      setSuccess("Alert deleted successfully!");
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError("Error deleting alert: " + err.message);
    }
  };

  const getConditionText = (condition) => {
    const conditions = {
      'SUNNY': 'Sunny (Low cloudiness)',
      'RAINY': 'Rainy (Precipitation)',
      'WINDY': 'Windy (High wind speed)',
      'HOT': 'Hot temperature',
      'COLD': 'Cold temperature'
    };
    return conditions[condition] || condition;
  };

  const getComparisonText = (comparison) => {
    const comparisons = {
      'GT': 'greater than',
      'LT': 'less than',
      'EQ': 'equal to'
    };
    return comparisons[comparison] || comparison;
  };

  const getConditionUnit = (condition) => {
    switch(condition) {
      case 'SUNNY':
      case 'RAINY':
        return '%';
      case 'WINDY':
        return 'km/h';
      case 'HOT':
      case 'COLD':
        return '°C';
      default:
        return '';
    }
  };

  return (
    <div className="user-weather-alerts">
      <h3>Custom Weather Alerts</h3>
      
      {}
      {success && (
        <div className="alert-success">
          {success}
        </div>
      )}
      
      {}
      {error && (
        <div className="alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {}
      {matchedAlerts.length > 0 && (
        <div className="matched-alerts">
          <h4>Active Alerts</h4>
          {matchedAlerts.map((alert, index) => (
            <div key={index} className="matched-alert">
              <span className="alert-icon">⚠️</span> {alert.message}
            </div>
          ))}
        </div>
      )}
      
      {}
      {showForm ? (
        <div className="alert-form">
          <h4>Create New Alert</h4>
          <form onSubmit={handleCreateAlert}>
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text"
                name="name"
                value={newAlert.name}
                onChange={handleInputChange}
                placeholder="Alert name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Condition:</label>
              <select
                name="condition"
                value={newAlert.condition}
                onChange={handleInputChange}
                required
              >
                <option value="SUNNY">Sunny (Low cloudiness)</option>
                <option value="RAINY">Rainy (Precipitation)</option>
                <option value="WINDY">Windy (High wind speed)</option>
                <option value="HOT">Hot temperature</option>
                <option value="COLD">Cold temperature</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Comparison:</label>
              <select
                name="comparison"
                value={newAlert.comparison}
                onChange={handleInputChange}
                required
              >
                <option value="GT">Greater than</option>
                <option value="LT">Less than</option>
                <option value="EQ">Equal to</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Threshold ({getConditionUnit(newAlert.condition)}):</label>
              <input 
                type="number"
                name="threshold"
                value={newAlert.threshold}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-buttons">
              <button type="submit" className="btn-create">Create Alert</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <button className="btn-add-alert" onClick={() => setShowForm(true)}>
          + Add Custom Alert
        </button>
      )}
      
      {}
      {alerts.length > 0 && (
        <div className="alerts-list">
          <h4>Your Custom Alerts</h4>
          {alerts.map((alert) => (
            <div key={alert.id} className="user-alert">
              <div className="alert-content">
                <strong>{alert.name}</strong>
                <p>Alert when {getConditionText(alert.condition)} is {getComparisonText(alert.comparison)} {alert.threshold}{getConditionUnit(alert.condition)}</p>
              </div>
              <button className="btn-delete" onClick={() => handleDeleteAlert(alert.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserWeatherAlerts; 