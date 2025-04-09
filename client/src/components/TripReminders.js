import React, { useState, useEffect, useRef } from 'react';
import './TripReminders.css';

const TripReminders = ({ weatherData, latitude, longitude }) => {
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [trips, setTrips] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: '',
    location: '',
    date: '',
    notes: '',
    weatherSnapshot: null,
    latitude: null,
    longitude: null
  });
  
  const [locationType, setLocationType] = useState("city");
  const [query_address, setQueryAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [typedLatitude, setTypedLatitude] = useState("");
  const [typedLongitude, setTypedLongitude] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const suggestionsCache = useRef({});
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    const savedTrips = localStorage.getItem('plannedTrips');
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips));
    }
  }, []);

  useEffect(() => {
    if (trips.length > 0) {
      localStorage.setItem('plannedTrips', JSON.stringify(trips));
    } else {
      localStorage.removeItem('plannedTrips');
    }
  }, [trips]);
  
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const detectWeatherChanges = (oldSnapshot, newSnapshot) => {
    const changes = [];
    
    if (oldSnapshot.daily && newSnapshot.daily && 
        oldSnapshot.daily[0] && newSnapshot.daily[0]) {
      
      const oldTemp = oldSnapshot.daily[0].temp?.day;
      const newTemp = newSnapshot.daily[0].temp?.day;
      
      if (oldTemp && newTemp && Math.abs(newTemp - oldTemp) >= 3) {
        const direction = newTemp > oldTemp ? "higher" : "lower";
        changes.push(`Temperature is now ${newTemp.toFixed(1)}°C (${direction} than before)`);
      }
      
      const oldPrecip = oldSnapshot.daily[0].pop || 0;
      const newPrecip = newSnapshot.daily[0].pop || 0;
      
      if (Math.abs(newPrecip - oldPrecip) >= 0.2) {
        const direction = newPrecip > oldPrecip ? "higher" : "lower";
        changes.push(`Chance of precipitation is now ${(newPrecip * 100).toFixed(0)}% (${direction} than before)`);
      }
      
      const oldCondition = oldSnapshot.daily[0].weather && oldSnapshot.daily[0].weather[0]?.main;
      const newCondition = newSnapshot.daily[0].weather && newSnapshot.daily[0].weather[0]?.main;
      
      if (oldCondition && newCondition && oldCondition !== newCondition) {
        changes.push(`Weather changed from ${oldCondition} to ${newCondition}`);
      }
    }
    
    return changes;
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleAddressInputChange = (e) => {
    const query = e.target.value;
    setQueryAddress(query);
    setSuggestions([]);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (query.length < 2) {
      setShowSuggestions(false);
      return;
    }
    
    if (suggestionsCache.current[query]) {
      setSuggestions(suggestionsCache.current[query]);
      setShowSuggestions(true);
      return;
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        
        try {
          const response = await fetch(`${BASE_URL}/api/address/?address=${encodeURIComponent(query)}`);
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data && Array.isArray(data)) {
            const formattedSuggestions = data.map(item => ({
              label: item.address || item.display_name,
              value: item.address || item.display_name,
              latitude: item.latitude,
              longitude: item.longitude,
              isLocalMatch: false
            }));
            
            suggestionsCache.current[query] = formattedSuggestions;
            setSuggestions(formattedSuggestions);
            setShowSuggestions(formattedSuggestions.length > 0);
          }
        } catch (err) {
          console.error("Error fetching address suggestions:", err);
          setError("Failed to search for locations. Please try again.");
          setTimeout(() => setError(''), 3000);
        } finally {
          setIsLoading(false);
        }
      }
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setQueryAddress(suggestion.label || suggestion.value);
    setShowSuggestions(false);
    
    if (suggestion.latitude && suggestion.longitude) {
      setNewTrip({
        ...newTrip,
        location: suggestion.label || suggestion.value,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude
      });
      setSuccess(`Location set to ${suggestion.label || suggestion.value}`);
      setTimeout(() => setSuccess(''), 3000);
    } else if (suggestion.isLocalMatch) {
      setIsLoading(true);
      fetch(`${BASE_URL}/api/address/?address=${encodeURIComponent(suggestion.value || suggestion.label)}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            setNewTrip({
              ...newTrip,
              location: data[0].address || data[0].display_name,
              latitude: data[0].latitude,
              longitude: data[0].longitude
            });
            setSuccess(`Location set to ${data[0].address || data[0].display_name}`);
          } else {
            setError("Could not find coordinates for this location");
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching coordinates for suggestion:", err);
          setError("Failed to get coordinates for this location");
          setIsLoading(false);
        });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTrip({
      ...newTrip,
      [name]: value
    });
  };

  const handleLocationTypeChange = (e) => {
    setLocationType(e.target.value);
    setSuggestions([]);
    setShowSuggestions(false);
    setQueryAddress("");
    setTypedLatitude("");
    setTypedLongitude("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newTrip.latitude || !newTrip.longitude) {
      setError("Please select a location for your trip");
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      const response = await fetch(
        `${BASE_URL}/api/weather/?lat=${newTrip.latitude}&lon=${newTrip.longitude}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch weather data for location");
      }
      
      const weatherData = await response.json();
      
      const tripToAdd = {
        ...newTrip,
        id: Date.now().toString(),
        weatherSnapshot: weatherData,
        createdAt: new Date().toISOString()
      };
      
      setTrips([...trips, tripToAdd]);
      
      setNewTrip({
        name: '',
        location: '',
        date: '',
        notes: '',
        weatherSnapshot: null,
        latitude: null,
        longitude: null
      });
      setQueryAddress("");
      setSuccess("Trip saved successfully!");
      setShowForm(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error saving trip:", err);
      setError("Failed to save trip. Please try again.");
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteTrip = (id) => {
    setTrips(trips.filter(trip => trip.id !== id));
  };

  const useCurrentLocation = () => {
    if (latitude && longitude) {
      setNewTrip({
        ...newTrip,
        latitude: latitude,
        longitude: longitude,
        location: "Current Location"
      });
      setSuccess("Current location set for trip");
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError("Current location not available");
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleManualGpsSubmit = () => {
    const lat = parseFloat(typedLatitude);
    const lon = parseFloat(typedLongitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      setNewTrip({
        ...newTrip,
        latitude: lat,
        longitude: lon,
        location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      });
      setSuccess("GPS coordinates set for trip");
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError("Please enter valid GPS coordinates");
      setTimeout(() => setError(''), 3000);
    }
  };

  const simulateNotification = () => {
    if (trips.length === 0) {
      setError("You need to create at least one trip first");
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const sampleTrip = trips[0];
    const changes = [
      "Temperature is now 28°C (higher than before)",
      "Weather changed from Clear to Rain",
      "Chance of precipitation is now 60% (higher than before)"
    ];
    
    setNotifications([{
      tripId: sampleTrip.id,
      tripName: sampleTrip.name,
      date: sampleTrip.date,
      changes: changes
    }]);
    
    setShowNotification(true);
  };

  return (
    <div className="card-container">
      <div className="card">
        <h3 className="card-title">Trip Weather Planner</h3>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {showForm ? (
          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Trip Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newTrip.name}
                  onChange={handleInputChange}
                  required
                  className="text-input"
                  placeholder="Summer Vacation"
                />
              </div>
              
              <div className="form-group">
                <label>Location Type:</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="city"
                      checked={locationType === "city"}
                      onChange={handleLocationTypeChange}
                    />
                    City/Address
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="gps"
                      checked={locationType === "gps"}
                      onChange={handleLocationTypeChange}
                    />
                    GPS Coordinates
                  </label>
                </div>
              </div>
              
              {locationType !== "gps" ? (
                <div className="form-group">
                  <label>Search Location:</label>
                  <div className="location-search">
                    <input
                      type="text"
                      placeholder="Enter your city or address"
                      value={query_address}
                      onChange={handleAddressInputChange}
                      className="text-input"
                      onFocus={() => {
                        if (query_address.length >= 2 && suggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowSuggestions(false);
                        }, 200);
                      }}
                    />
                    
                    {isLoading && <div className="loading-text">Loading...</div>}
                    
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="suggestions-list">
                        {suggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="suggestion-item"
                          >
                            {suggestion.label || suggestion.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label>GPS Coordinates:</label>
                  <div className="gps-input-group">
                    <input
                      type="text"
                      placeholder="Latitude (e.g., 40.7128)"
                      value={typedLatitude}
                      onChange={(e) => setTypedLatitude(e.target.value)}
                      className="text-input"
                    />
                    <input
                      type="text"
                      placeholder="Longitude (e.g., -74.0060)"
                      value={typedLongitude}
                      onChange={(e) => setTypedLongitude(e.target.value)}
                      className="text-input"
                    />
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleManualGpsSubmit}
                    className="btn-primary"
                  >
                    Set GPS Coordinates
                  </button>
                </div>
              )}
              
              <div className="button-group">
                <button 
                  type="button" 
                  onClick={useCurrentLocation}
                  className="btn-secondary"
                >
                  Use Current Location
                </button>
              </div>
              
              {newTrip.latitude && newTrip.longitude && (
                <div className="selected-info">
                  <p>
                    <strong>Selected:</strong> {newTrip.location || `${newTrip.latitude.toFixed(4)}, ${newTrip.longitude.toFixed(4)}`}
                  </p>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="date">Date:</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={newTrip.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="text-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notes:</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newTrip.notes}
                  onChange={handleInputChange}
                  placeholder="Bring hiking boots and water"
                  className="text-area"
                />
              </div>
              
              <div className="button-group">
                <button type="submit" className="btn-primary">Save Trip</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="button-group">
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + Plan a New Trip
            </button>
            <button 
              className="btn-secondary" 
              onClick={simulateNotification}
            >
              Test Notification
            </button>
          </div>
        )}
      </div>
      
      {}
      {trips.length > 0 && (
        <div className="card">
          <h3 className="card-title">Your Planned Trips</h3>
          {trips.map(trip => (
            <div key={trip.id} className="list-item">
              <div className="item-content">
                <div className="item-header">
                  <h4 className="item-title">{trip.name}</h4>
                  <span className="item-date">{formatDate(trip.date)}</span>
                </div>
                <p className="item-subtitle">{trip.location || `${trip.latitude.toFixed(4)}, ${trip.longitude.toFixed(4)}`}</p>
                {trip.notes && <p className="item-description">{trip.notes}</p>}
              </div>
              <button className="btn-delete" onClick={() => handleDeleteTrip(trip.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
      
      {}
      {showNotification && notifications.length > 0 && (
        <div className="notification-popup">
          <div className="notification-header">
            <h4>Weather Update for Your Trip</h4>
            <button className="close-notification" onClick={() => setShowNotification(false)}>×</button>
          </div>
          <div className="notification-content">
            <p><strong>{notifications[0].tripName}</strong> on {formatDate(notifications[0].date)}</p>
            <ul>
              {notifications[0].changes.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripReminders; 