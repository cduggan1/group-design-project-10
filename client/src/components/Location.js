import React, { useState, useEffect, useRef, use } from "react";

const Location = ({
  updateLocation,
  initialLocation,
  fetchDefaultLocation,
  saveDefaultLocation,
  showHeader = true,
  showButtons = true,
}) => {
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [locationType, setLocationType] = useState("city"); // "city", "landmark", or "gps"

  // For the suggestions logic (City/Landmark)
  const [query_address, setQueryAddress] = useState("");
  const [location, setLocation] = useState(initialLocation || null);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // For manual GPS inputs
  const [typedLatitude, setTypedLatitude] = useState("");
  const [typedLongitude, setTypedLongitude] = useState("");

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

  // Radio button logic: Switch between city/landmark vs. GPS inputs

  const handleLocationTypeChange = (e) => {
    setLocationType(e.target.value);
    // Clear out suggestions and any typed GPS if switching modes
    setSuggestions([]);
    setShowSuggestions(false);
    setQueryAddress("");
    setTypedLatitude("");
    setTypedLongitude("");
  };

  const fetchGpsLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude, address: "Fetching address..." });
        updateLocation(latitude, longitude, "Fetching address...");
        const address = await getGeocodedAddress(latitude, longitude);
        setLocation({ latitude, longitude, address });
        updateLocation(latitude, longitude, address);
      },
      (err) => {
        setError("Failed to retrieve GPS location");
      }
    );
  };
  
  // GPS: Manually typed lat/lon

  const handleManualGpsSubmit = () => {
    const latNum = parseFloat(typedLatitude);
    const lonNum = parseFloat(typedLongitude);
    if (isNaN(latNum) || isNaN(lonNum)) {
      setError("Please enter valid numeric latitude and longitude.");
      return;
    }
    setLocation({ latitude: latNum, longitude: lonNum, address: "Manual GPS" });
    updateLocation(latNum, lonNum, "Manual GPS");
    setError("");
  };


  const getGeocodedAddress = async (lat, lon) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/reverse-address?latitude=${lat}&longitude=${lon}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }
      const data = await response.json();
      console.log(data);
      return data[0].address;
    } catch (err) {
      console.error("Error fetching address:", err);
      return "Address not found";
    }
  };

  const fetchCoordinates = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/address/?address=${query_address}`
      );
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
  }

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

      let combinedSuggestions = [...data];

      if (data.length < 2 && clientSideSuggestions.length > 0) {
        combinedSuggestions = [...clientSideSuggestions];
      }

      data.forEach(apiSuggestion => {
        const isDuplicate = combinedSuggestions.some(
          s => s.label.toLowerCase() === apiSuggestion.label.toLowerCase()
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


  const buttonStyle = {
    padding: "8px 16px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    textAlign: "center"
  };

  const handleSelectSuggestion = (suggestion) => {
    setQueryAddress(suggestion.value || suggestion.label);

    if (suggestion.isLocalMatch) {
      setIsLoading(true);
      fetch(`${BASE_URL}/api/address/?address=${encodeURIComponent(suggestion.value || suggestion.label)}`)
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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "30px",
        padding: "20px",
      }}
    >
      {}
      <div style={{ flex: 1, textAlign: "center" }}>
        {showHeader && <h2>Set Location</h2>}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Enter your city or address"
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

          {}
          {isLoading && (
            <div
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#666",
              }}
            >
              Loading...
            </div>
          )}

          {}
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                width: "100%",
                maxHeight: "200px",
                overflowY: "auto",
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderRadius: "4px",
                zIndex: 10,
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              }}
            >
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
        {/* Only show the green buttons if showButtons === true */}
        {showButtons && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "15px", 
          marginTop: "15px",
          justifyContent: "center" // Centers the buttons in the grid
        }}>
          <button onClick={fetchCoordinates} style={buttonStyle}>Get Coordinates</button>
          <button onClick={fetchGpsLocation} style={buttonStyle}>Use GPS Location</button>
          <button onClick={saveDefaultLocation} style={buttonStyle}>Save as Default</button>
          <button onClick={fetchDefaultLocation} style={buttonStyle}>Fetch Default Location</button>
        </div>
        )}

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
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            color: "red",
          }}
        >
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Location;
