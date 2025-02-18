import './App.css';
import React, { useState } from "react";
import Weather from "./components/Weather";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Location from './components/Location';
import Directions from './components/Directions';

function App() {
    const [location, setLocation] = useState({
      latitude: null,
      longitude: null,
    });
    
    const updateLocation = (lat, lon) => {
      setLocation({ latitude: lat, longitude: lon });
    };
    
    return (
        <Router>
            <div>
                {/* Navbar with links */}
                <nav>
                    <ul>
                        <li><Link to="/location">Location</Link></li>
                        <li><Link to="/">Weather</Link></li>
                        <li><Link to="/directions">Directions</Link></li>
                    </ul>
                </nav>

                <Routes>
                    <Route 
                        path="/location" 
                        element={<Location updateLocation={updateLocation} initialCoordinates={location} />} 
                    />
                    <Route 
                        path="/" 
                        element={<Weather latitude={location.latitude} longitude={location.longitude} />} 
                    />
                    <Route path="/directions" element={<Directions latitude={location.latitude} longitude={location.longitude} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
