import "./App.css";
import React, { useEffect, useState } from "react";
import Weather from "./components/Weather";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Location from "./components/Location";
import Directions from "./components/Directions";
import CompareWeather from "./components/CompareWeather";

function App() {
  // State for user location
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    adr: null,
  });

  const [isDefaultLocation, setIsDefaultLocation] = useState(false);

  useEffect(() => {
    if (!isDefaultLocation) {
      console.log("Fetching default location");
      fetchDefaultLocation();
      setIsDefaultLocation(true);
    }
  }, [isDefaultLocation]);

  const fetchDefaultLocation = () => {
    const savedLocation = localStorage.getItem("defaultLocation");
    if (savedLocation) {
      const parsedLocation = JSON.parse(savedLocation);
      setLocation(parsedLocation);
      updateLocation(
        parsedLocation.latitude,
        parsedLocation.longitude,
        parsedLocation.address
      );
    }
  };

  const saveDefaultLocation = () => {
    if (
      location &&
      location.latitude &&
      location.longitude &&
      location.address
    ) {
      localStorage.setItem("defaultLocation", JSON.stringify(location));
      alert("Default location saved successfully!");
    } else {
      alert("No valid location to save.");
    }
  };

  const updateLocation = (lat, lon, adr) => {
    setLocation({ latitude: lat, longitude: lon, address: adr });
  };

  // State for destination as a string (e.g., "latitude, longitude")
  const [destination, setDestination] = useState({
    latitude: null,
    longitude: null,
  });

  // Update destination as a string for Directions component
  const updateDestination = (lat, lon) => {
    setDestination({ latitude: lat, longitude: lon });
  };

  return (
    <Router>
      <div>
        {/* Navbar with links */}

        <nav>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <li style={{ display: "flex", alignItems: "center" }}>
              <Link to="/">Set Location</Link>
            </li>
            <li className="arrow">→</li>
            <li style={{ display: "flex", alignItems: "center" }}>
              <Link to="/weather">Weather</Link>
            </li>
            <li className="arrow">→</li>
            <li style={{ display: "flex", alignItems: "center" }}>
              <Link to="/directions">Directions</Link>
            </li>
            <li className="arrow">→</li>
            <li style={{ display: "flex", alignItems: "center" }}>
              <Link to="/directions">Compare Weather</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <Location
                updateLocation={updateLocation}
                fetchDefaultLocation={fetchDefaultLocation}
                saveDefaultLocation={saveDefaultLocation}
                initialLocation={location}
              />
            }
          />
          <Route
            path="/weather"
            element={
              <Weather
                latitude={location.latitude}
                longitude={location.longitude}
                updateDestination={updateDestination}
              />
            }
          />
          <Route
            path="/directions"
            element={
              <Directions
                latitude={location.latitude}
                longitude={location.longitude}
                trailAdr={destination.latitude}
                trailLon={destination.longitude}
              />
            }
          />
          <Route
            path="/compare"
            element={
              <CompareWeather
                BASE_URL={process.env.REACT_APP_API_URL} 
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
