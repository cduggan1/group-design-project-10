import './App.css';
import React from "react";
import Weather from "./components/Weather";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Location from './components/Location';
import Directions from './components/Directions';

function App() {
  return (
    <Router>
      <div>
        {/* Navbar with links */}
        <nav>
          <ul>
            <li><Link to="/">Weather</Link></li>
            <li><Link to="/location">Location</Link></li>
            <li><Link to="/directions">Directions</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Weather />} />
          <Route path="/location" element={<Location />} />
          <Route path="/directions" element={<Directions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
