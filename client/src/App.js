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
    const [destination, setDestination] = useState({
      latitude: null,
      longitude: null,
    });

    // Update destination as a string for Directions component
    const updateDestination = (lat, lon) => {
        setDestination({latitude: lat, longitude: lon});
    };

    return (
        <Router>
            <div>
                {/* Navbar with links */}
            
                <nav>
                    <ul style={{ 
                        listStyle: 'none', 
                        display: 'flex', 
                        gap: '10px', 
                        alignItems: 'center' 
                    }}>
                        <li style={{ display: 'flex', alignItems: 'center' }}>
                            <Link to="/">Set Location</Link>
                        </li>
                        <li className="arrow">→</li>
                        <li style={{ display: 'flex', alignItems: 'center' }}>
                            <Link to="/weather">Weather</Link>
                        </li>
                        <li className="arrow">→</li>
                        <li style={{ display: 'flex', alignItems: 'center' }}>
                            <Link to="/directions">Directions</Link>
                        </li>
                    </ul>
                </nav>

                <Routes>
                    <Route 
                        path="/" 
                        element={<Location updateLocation={updateLocation} initialLocation={location} />} 
                    />
                    <Route 
                        path="/weather" 
                        element={<Weather latitude={location.latitude} longitude={location.longitude} updateDestination={updateDestination}/>} 
                    />
                    <Route
                        path="/directions"
                        element={<Directions latitude={location.latitude} longitude={location.longitude} trailAdr={destination.latitude} trailLon={destination.longitude}/>} 
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
