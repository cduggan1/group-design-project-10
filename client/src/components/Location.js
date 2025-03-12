import React, { useState, useEffect, useRef } from "react";

const Location = ({ updateLocation, selectedLocations,setSelectedLocations, initialLocation  }) => {
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [query_address, setQueryAddress] = useState("");
  const [location, setLocation] = useState(initialLocation || null);
  const [error, setError] = useState(""); 
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const suggestionsCache = useRef({});
  const debounceTimerRef = useRef(null);
  
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

  const fetchCoordinates = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/address/?address=${query_address}`);
      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }
      const data = await response.json();
      setLocation(data[0]);
      setError("");

      updateLocation(data[0].latitude, data[0].longitude, data[0].address);
    } catch (err) {
      setError("Failed to fetch coordinates");
      setLocation(null);
    }
  };
  const removeLocation = (index) => {
    setSelectedLocations((prev) => prev.filter((_, i) => i !== index));
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

    setSelectedLocations((prev) => {
        if (!Array.isArray(prev)) prev = []; // Ensure prev is an array
        if (!prev.some((loc) => loc.latitude === suggestion.latitude && loc.longitude === suggestion.longitude)) {
            return [...prev, {
                latitude: suggestion.latitude,
                longitude: suggestion.longitude,
                address: suggestion.label
            }];
        }
        return prev;
    });

    setSuggestions([]);
    setShowSuggestions(false);
};


  

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: "30px", padding: "20px" }}>
      {}
      <div style={{ flex: 1, textAlign: "center" }}>
        <h2>Set Location</h2>
        <div style={{ position: "relative" }}>
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
        
        <button onClick={fetchCoordinates}>Get Coordinates</button>

        {}
        {location ? (
          <p>Current location: {location.address}<br />{location.latitude} {location.longitude}</p>
        ) : (
          <p>No location set</p>
        )}
      </div>
        {/* Show selected locations */}
        {selectedLocations.length > 0 && (
          <div>
            <h3>Selected Locations:</h3>
            <ul>
              {selectedLocations.map((loc, index) => (
                <li key={index}>
                  {loc.address} ({loc.latitude}, {loc.longitude})  
                  <button onClick={() => removeLocation(index)} style={{ marginLeft: "10px" }}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      {}
      {error && (
        <div style={{ position: "absolute", bottom: "20px", left: "20px", color: "red" }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Location;