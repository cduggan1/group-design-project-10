import './App.css';
import React, { useState } from "react";
import Weather from "./components/Weather";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Location from './components/Location';
import Directions from './components/Directions';

function App() {
    // Store multiple selected locations
    const [selectedLocations, setSelectedLocations] = useState([]);
    
    // Update multiple locations
    const updateLocation = (newLocations) => {
        setSelectedLocations(newLocations); // Store the entire array of selected locations
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
                        element={<Location updateLocation={updateLocation} 
                        selectedLocations={selectedLocations} 
                        setSelectedLocations={setSelectedLocations}
                        initialLocation={selectedLocations.length > 0 ? selectedLocations[0] : null}  />} 
                    />
                    <Route 
                        path="/weather" 
                        element={<Weather  selectedLocations={selectedLocations || []} updateDestination={updateDestination} setSelectedLocations={setSelectedLocations} />}
                    />
                    <Route
                        path="/directions"
                        element={<Directions latitude={destination.latitude} longitude={destination.longitude} />} 
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
