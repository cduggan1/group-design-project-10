import React, { useState, useEffect } from 'react';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load saved trips from localStorage on component mount
  useEffect(() => {
    const savedTrips = localStorage.getItem('plannedTrips');
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips));
    }
  }, []);

  // Save trips to localStorage whenever they change
  useEffect(() => {
    if (trips.length > 0) {
      localStorage.setItem('plannedTrips', JSON.stringify(trips));
    }
  }, [trips]);

  // Check for weather changes for upcoming trips
  useEffect(() => {
    if (!weatherData || !weatherData.length) return;
    
    const checkWeatherChanges = async () => {
      const upcomingTrips = trips.filter(trip => {
        const tripDate = new Date(trip.date);
        const now = new Date();
        // Only check trips in the future and within the next 7 days
        return tripDate > now && tripDate <= new Date(now.setDate(now.getDate() + 7));
      });
      
      if (upcomingTrips.length === 0) return;
      
      // For each upcoming trip, check current weather forecast and compare with saved snapshot
      const newNotifications = [];
      
      for (const trip of upcomingTrips) {
        try {
          // Fetch current forecast for the trip location
          const response = await fetch(
            `${BASE_URL}/api/weather/?lat=${trip.latitude}&lon=${trip.longitude}`
          );
          
          if (!response.ok) {
            throw new Error("Failed to fetch weather for trip location");
          }
          
          const currentForecast = await response.json();
          
          // If we have a previous snapshot, compare for significant changes
          if (trip.weatherSnapshot) {
            const changes = detectWeatherChanges(trip.weatherSnapshot, currentForecast);
            
            if (changes.length > 0) {
              newNotifications.push({
                id: Date.now() + Math.random(),
                tripId: trip.id,
                tripName: trip.name,
                location: trip.location,
                date: trip.date,
                changes: changes,
                timestamp: new Date()
              });
              
              // Update the weather snapshot for this trip
              setTrips(prevTrips => 
                prevTrips.map(t => 
                  t.id === trip.id ? {...t, weatherSnapshot: currentForecast} : t
                )
              );
            }
          } else {
            // If no previous snapshot exists, save the current forecast
            setTrips(prevTrips => 
              prevTrips.map(t => 
                t.id === trip.id ? {...t, weatherSnapshot: currentForecast} : t
              )
            );
          }
        } catch (err) {
          console.error("Error checking weather for trip:", err);
        }
      }
      
      // Add new notifications
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 10));
        setShowNotification(true);
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 10000);
      }
    };
    
    checkWeatherChanges();
    
    // Check for weather changes every 3 hours
    const intervalId = setInterval(checkWeatherChanges, 3 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [weatherData, trips, BASE_URL]);

  // Handle input changes for the trip form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTrip({
      ...newTrip,
      [name]: value
    });
  };

  // Set current location for the trip
  const useCurrentLocation = () => {
    setNewTrip({
      ...newTrip,
      latitude: latitude,
      longitude: longitude
    });
    setSuccess("Current location set for trip");
    setTimeout(() => setSuccess(''), 3000);
  };

  // Create a new trip
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    
    if (!newTrip.name || !newTrip.date || !newTrip.latitude || !newTrip.longitude) {
      setError("Please fill in all required fields and set a location");
      return;
    }
    
    try {
      // Fetch weather forecast for the trip location to get an initial snapshot
      const response = await fetch(
        `${BASE_URL}/api/weather/?lat=${newTrip.latitude}&lon=${newTrip.longitude}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch weather for trip location");
      }
      
      const weatherSnapshot = await response.json();
      
      // Create a new trip with all details
      const tripData = {
        ...newTrip,
        id: Date.now(),
        weatherSnapshot: weatherSnapshot,
        created: new Date().toISOString()
      };
      
      // Add to trips state
      setTrips(prevTrips => [...prevTrips, tripData]);
      
      // Reset form
      setNewTrip({
        name: '',
        location: '',
        date: '',
        notes: '',
        weatherSnapshot: null,
        latitude: null,
        longitude: null
      });
      
      setShowForm(false);
      setSuccess("Trip created successfully!");
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError("Error creating trip: " + err.message);
    }
  };

  // Delete a trip
  const handleDeleteTrip = (id) => {
    setTrips(trips.filter(trip => trip.id !== id));
    setSuccess("Trip deleted successfully!");
    setTimeout(() => setSuccess(''), 3000);
  };

  // Detect significant weather changes
  const detectWeatherChanges = (oldForecast, newForecast) => {
    const changes = [];
    
    // Compare relevant forecast data points
    if (!oldForecast || !oldForecast[0] || !newForecast || !newForecast[0]) {
      return changes;
    }
    
    const old = oldForecast[0];
    const current = newForecast[0];
    
    // Check for temperature changes (more than 5 degrees)
    if (Math.abs(current.temperature - old.temperature) > 5) {
      const direction = current.temperature > old.temperature ? "higher" : "lower";
      changes.push(`Temperature is now ${Math.round(current.temperature)}°C (${direction} than before)`);
    }
    
    // Check for precipitation changes
    if (current.rain > 0 && old.rain === 0) {
      changes.push(`Rain is now in the forecast (${current.rain}mm expected)`);
    } else if (current.rain === 0 && old.rain > 0) {
      changes.push(`Rain is no longer in the forecast`);
    } else if (Math.abs(current.rain - old.rain) > 5) {
      const direction = current.rain > old.rain ? "more" : "less";
      changes.push(`Expected rain has changed to ${current.rain}mm (${direction} than before)`);
    }
    
    // Check for wind speed changes
    if (Math.abs(current.wind_speed - old.wind_speed) > 10) {
      const direction = current.wind_speed > old.wind_speed ? "higher" : "lower";
      changes.push(`Wind speed is now ${Math.round(current.wind_speed)} km/h (${direction} than before)`);
    }
    
    // Check for weather condition changes
    if (current.weather_condition !== old.weather_condition) {
      changes.push(`Weather changed from ${old.weather_condition} to ${current.weather_condition}`);
    }
    
    return changes;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="trip-reminders">
      <h3>Planned Trips</h3>
      
      {/* Success and error messages */}
      {success && (
        <div className="alert-success">
          {success}
        </div>
      )}
      
      {error && (
        <div className="alert-error">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {/* Trip creation form */}
      {showForm ? (
        <div className="trip-form">
          <h4>Add New Trip</h4>
          <form onSubmit={handleCreateTrip}>
            <div className="form-group">
              <label htmlFor="name">Trip Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newTrip.name}
                onChange={handleInputChange}
                placeholder="Weekend Hike"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Location:</label>
              <input
                type="text"
                id="location"
                name="location"
                value={newTrip.location}
                onChange={handleInputChange}
                placeholder="Howth, Dublin"
              />
              <button type="button" className="btn-use-location" onClick={useCurrentLocation}>
                Use Current Location
              </button>
            </div>
            
            <div className="form-group">
              <label htmlFor="date">Date:</label>
              <input
                type="date"
                id="date"
                name="date"
                value={newTrip.date}
                onChange={handleInputChange}
                required
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
              />
            </div>
            
            <div className="form-buttons">
              <button type="submit" className="btn-create">Save Trip</button>
              <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <button className="btn-add-trip" onClick={() => setShowForm(true)}>
          + Plan a New Trip
        </button>
      )}
      
      {/* List of planned trips */}
      {trips.length > 0 && (
        <div className="trips-list">
          <h4>Your Upcoming Trips</h4>
          {trips.map((trip) => (
            <div key={trip.id} className="trip-item">
              <div className="trip-content">
                <div className="trip-header">
                  <strong>{trip.name}</strong>
                  <span className="trip-date">{formatDate(trip.date)}</span>
                </div>
                <p className="trip-location">{trip.location || `Lat: ${trip.latitude.toFixed(4)}, Lon: ${trip.longitude.toFixed(4)}`}</p>
                {trip.notes && <p className="trip-notes">{trip.notes}</p>}
              </div>
              <button className="btn-delete" onClick={() => handleDeleteTrip(trip.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
      
      {/* Weather change notification popup */}
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