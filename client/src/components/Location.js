import React, { useState, useEffect, useRef } from "react";

// Location component that allows users to search for an address and fetch coordinates
const Location = ({ updateLocation, initialLocation }) => {
  const BASE_URL = process.env.REACT_APP_API_URL; // Base API URL from environment variables

  // State variables to manage the component's data
  const [query_address, setQueryAddress] = useState("");
  const [location, setLocation] = useState(initialLocation || null); // Stores selected location data
  const [error, setError] = useState(""); // Stores error messages
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  const suggestionsCache = useRef({});
  const debounceTimerRef = useRef(null);

  // Effect to set initial location if provided
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Function to fetch coordinates based on the query_address
  const fetchCoordinates = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/address/?address=${query_address}`);
      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }
      const data = await response.json();
      setLocation(data[0]); // Update location state
      setError("");

      // Update parent component with the new location data
      updateLocation(data[0].latitude, data[0].longitude, data[0].address);
    } catch (err) {
      setError("Failed to fetch coordinates");
      setLocation(null);
    }
  };


  const handleInputChange = (e) => {
    const value = e.target.value;
    setQueryAddress(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length >= 2) {
      if (suggestionsCache.current[value]) {
        setSuggestions(suggestionsCache.current[value]);
        setShowSuggestions(true);
        return;
      }

      setIsLoading(true);

      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 150);
    } else {
      setSuggestions([]);
      setIsLoading(false);
      setShowSuggestions(false);
    }
  };

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/location-suggestions/?query=${query}`);

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();

      suggestionsCache.current[query] = data;

      setSuggestions(data);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setQueryAddress(suggestion.label);
    setLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.label
    });
    updateLocation(suggestion.latitude, suggestion.longitude, suggestion.label);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
      {/* Main container for input and suggestions */}
      <div style={{ flex: 1, textAlign: "center" }}>
        <h2>Set Location</h2>
        <div style={{ position: "relative" }}>
          {/* Address input field */}
          <input
            type="text"
            placeholder="Address"
            value={query_address}
            onChange={handleInputChange}
            onFocus={() => {
              if (query_address.length >= 2 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            style={{ width: "100%", padding: "8px", marginBottom: "5px" }}
          />

          {}
          {isLoading && (
            <div style={{ 
              position: "absolute", 
              right: "10px", 
              top: "50%", 
              transform: "translateY(-50%)",
              color: "#666"
            }}>
              Loading...
            </div>
          )}

          {}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute",
              width: "100%",
              maxHeight: "200px",
              overflowY: "auto",
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "4px",
              zIndex: 10,
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: index < suggestions.length - 1 ? "1px solid #eee" : "none",
                    textAlign: "left"
                  }}
                  onMouseDown={() => handleSelectSuggestion(suggestion)}
                  onTouchStart={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.label}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Button to manually fetch coordinates */}
        <button onClick={fetchCoordinates}>Get Coordinates</button>

        {/* Display selected location or message if none is set */}
        {location ? (
          <p>Current location: {location.address}<br />{location.latitude} {location.longitude}</p>
        ) : (
          <p>No location set</p>
        )}
      </div>

      {/* Error message display */}
      {error && (
        <div style={{ position: "absolute", bottom: "20px", left: "20px", color: "red" }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Location;
