import './App.css';
import React, { useState } from "react";
import Weather from "./components/Weather";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Location from './components/Location';
import Directions from './components/Directions';

function App() {
    // State for user location
    const [location, setLocation] = useState({
      latitude: null,
      longitude: null,
      adr: null,
    });
    
    const updateLocation = (lat, lon, adr) => {
      setLocation({ latitude: lat, longitude: lon, address: adr });
    };

    // State for destination as a string (e.g., "latitude, longitude")
    const [destination, setDestination] = useState("");

    // Update destination as a string for Directions component
    const updateDestination = (lat, lon) => {
        setDestination(`${lat}, ${lon}`);
    };

    return (
        <Router>
            <div>
                {/* Navbar with links */}
                <nav>
                    <ul>
                        <li><Link to="/location">Set Location</Link></li>
                        <li><Link to="/">Weather</Link></li>
                        <li><Link to="/directions">Directions</Link></li>
                    </ul>
                </nav>

                <Routes>
                    <Route 
                        path="/location" 
                        element={<Location updateLocation={updateLocation} initialLocation={location} />} 
                    />
                    <Route 
                        path="/" 
                        element={<Weather latitude={location.latitude} longitude={location.longitude} updateDestination={updateDestination}/>} 
                    />
                    <Route
                        path="/directions"
                        element={<Directions latitude={location.latitude} longitude={location.longitude} trailDestination={destination} />} 
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
