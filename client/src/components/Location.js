import React, { useState, useEffect, useRef } from "react";

const Location = ({ updateLocation, initialLocation }) => {
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
      updateLocation(data[0].latitude, data[0].longitude, data[0].address);
      setError("");
    } catch (err) {
      setError("Failed to fetch coordinates");
      setLocation(null);
    }
  };

  const calculateSimilarity = (str1, str2) => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    const matrix = Array(s1.length + 1).fill().map(() => Array(s2.length + 1).fill(0));
    
    for (let i = 0; i <= s1.length; i++) {
      matrix[i][0] = i;
    }
    
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const maxLength = Math.max(s1.length, s2.length);
    return maxLength === 0 ? 1 : 1 - matrix[s1.length][s2.length] / maxLength;
  };

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    if (suggestionsCache.current[query]) {
      setSuggestions(suggestionsCache.current[query]);
      setShowSuggestions(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const commonCities = [
        "Dublin", "Cork", "Galway", "Limerick", "Waterford", 
        "Drogheda", "Kilkenny", "Wexford", "Sligo", "Athlone"
      ];
      
      let clientSideSuggestions = [];
      const queryLower = query.toLowerCase();
      
      commonCities.forEach(city => {
        const similarity = calculateSimilarity(queryLower, city.toLowerCase());
        if (similarity > 0.65) {
          clientSideSuggestions.push({
            id: `local-${city}`,
            label: `${city} (Possible match)`,
            value: city,
            isLocalMatch: true
          });
        }
      });
      
      const response = await fetch(`${BASE_URL}/api/location-suggestions/?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
      
      const data = await response.json();
      
      let combinedSuggestions = [];
      
      if (data.length < 2 && clientSideSuggestions.length > 0) {
        combinedSuggestions = [...clientSideSuggestions];
      }
      
      data.forEach(apiSuggestion => {
        const isDuplicate = combinedSuggestions.some(
          s => s.label.toLowerCase().includes(apiSuggestion.label.toLowerCase())
        );
        
        if (!isDuplicate) {
          combinedSuggestions.push(apiSuggestion);
        }
      });
      
      suggestionsCache.current[query] = combinedSuggestions;
      setSuggestions(combinedSuggestions);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQueryAddress(value);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    setQueryAddress(suggestion.value || suggestion.label);
    
    if (suggestion.isLocalMatch) {
      setIsLoading(true);
      fetch(`${BASE_URL}/api/address/?address=${encodeURIComponent(suggestion.value)}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.length > 0) {
            setLocation({
              latitude: data[0].latitude,
              longitude: data[0].longitude,
              address: data[0].address
            });
            updateLocation(data[0].latitude, data[0].longitude, data[0].address);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching coordinates for suggestion:", err);
          setIsLoading(false);
        });
    } else {
      setLocation({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        address: suggestion.value || suggestion.label
      });
      updateLocation(suggestion.latitude, suggestion.longitude, suggestion.value || suggestion.label);
    }
    
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleFocus = () => {
    if (query_address.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
      <div style={{ flex: 1, maxWidth: "600px", textAlign: "center" }}>
        <h2>Find a Location</h2>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Enter city or address"
            value={query_address}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            style={{ 
              width: "100%", 
              padding: "10px", 
              fontSize: "16px",
              borderRadius: "4px",
              border: "1px solid #ccc"
            }}
          />
          
          {isLoading && (
            <div style={{ position: "absolute", right: "10px", top: "10px" }}>
              Loading...
            </div>
          )}
          
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              maxHeight: "200px",
              overflowY: "auto",
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderTop: "none",
              borderRadius: "0 0 4px 4px",
              zIndex: 10,
              boxShadow: "0px 4px 8px rgba(0,0,0,0.1)"
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: index < suggestions.length - 1 ? "1px solid #eee" : "none",
                    textAlign: "left",
                    backgroundColor: suggestion.isLocalMatch ? "#f0fff0" : (index % 2 === 0 ? "#f9f9f9" : "white")
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
        
        <button 
          onClick={fetchCoordinates}
          style={{
            marginTop: "15px",
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Get Coordinates
        </button>

        {location ? (
          <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f0f8ff", borderRadius: "4px" }}>
            <p><strong>Current location:</strong> {location.address}<br />
            <span style={{ color: "#666" }}>Coordinates: {location.latitude}, {location.longitude}</span></p>
          </div>
        ) : (
          <p>No location set</p>
        )}
      </div>

      {error && (
        <div style={{ position: "absolute", bottom: "20px", left: "20px", color: "red", backgroundColor: "#fff", padding: "10px", borderRadius: "4px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Location;