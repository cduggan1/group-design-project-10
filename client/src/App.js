import './App.css'; // Importing global CSS styles
import React, { useState } from "react"; // Importing React and useState hook
import Weather from "./components/Weather"; // Importing Weather component
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom'; // Importing necessary components for routing
import Location from './components/Location'; // Importing Location component
import Directions from './components/Directions'; // Importing Directions component

function App() {
    // State for storing user location (latitude, longitude, and address)
    const [location, setLocation] = useState({
      latitude: null,
      longitude: null,
      adr: null,
    });
    
    // Function to update user location state
    const updateLocation = (lat, lon, adr) => {
      setLocation({ latitude: lat, longitude: lon, address: adr });
    };

    // State for storing destination coordinates (latitude and longitude)
    const [destination, setDestination] = useState({
      latitude: null,
      longitude: null,
    });

    // Function to update destination state
    const updateDestination = (lat, lon) => {
        setDestination({ latitude: lat, longitude: lon });
    };

    return (
        <Router>
            <div>
                {/* Navigation bar with links to different pages */}
                <nav>
                    <ul style={{ 
                        listStyle: 'none', 
                        display: 'flex', 
                        gap: '10px', 
                        alignItems: 'center' 
                    }}>
                        <li style={{ display: 'flex', alignItems: 'center' }}>
                            <Link to="/">Set Location</Link> {/* Link to Location component */}
                        </li>
                        <li className="arrow">→</li>
                        <li style={{ display: 'flex', alignItems: 'center' }}>
                            <Link to="/weather">Weather</Link> {/* Link to Weather component */}
                        </li>
                        <li className="arrow">→</li>
                        <li style={{ display: 'flex', alignItems: 'center' }}>
                            <Link to="/directions">Directions</Link> {/* Link to Directions component */}
                        </li>
                    </ul>
                </nav>

                {/* Defining Routes for different components */}
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

export default App; // Exporting the App component as default
