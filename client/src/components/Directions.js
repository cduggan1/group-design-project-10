import React, { useState, useEffect } from "react";

const Directions = ({ latitude, longitude, trailAdr }) => {
  const BASE_URL = process.env.REACT_APP_API_URL;
  const [start, setStart] = useState(`${latitude}, ${longitude}`);
  const [destination, setDestination] = useState(`${trailAdr}`);
  const [directions, setDirections] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDirections = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${BASE_URL}/api/directions/?from=${start}&to=${destination}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch directions");
      }
      const data = await response.json();
      setDirections(data);
    } catch (err) {
      setError(err.message);
      setDirections(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trailAdr) {
      setDestination(`${trailAdr}`);
    }
  }, [trailAdr]);

  useEffect(() => {
    setStart(`${latitude}, ${longitude}`);
  }, [latitude, longitude]);

  // Format duration from seconds to human-readable format
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format distance from meters to km if over 1000m
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Map step types to human-readable names
  const getStepType = (typeCode) => {
    const types = {
      0: "Turn left",
      1: "Turn right",
      6: "Continue straight",
      7: "Roundabout",
      10: "Arrive",
      11: "Head",
      12: "Keep left",
      13: "Keep right",
    };
    return types[typeCode] || `Maneuver (${typeCode})`;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Directions</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="From (latitude, longitude)"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          style={{ flex: 1, padding: "8px" }}
        />
        <input
          type="text"
          placeholder="To (latitude, longitude)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={{ flex: 1, padding: "8px" }}
        />
        <button
          onClick={fetchDirections}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Get Directions"}
        </button>
      </div>

      {error && (
        <div
          style={{ color: "red", marginBottom: "20px", textAlign: "center" }}
        >
          {error}
        </div>
      )}

      {directions && (
        <div>
          {/* Summary Section */}
          {directions?.summary && (
            <div
              style={{
                backgroundColor: "#f5f5f5",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Route Summary</h3>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <strong>Total Distance:</strong>{" "}
                  {formatDistance(directions.summary.total_distance)}
                </div>
                <div>
                  <strong>Driving Time:</strong>{" "}
                  {formatDuration(directions.summary.total_duration)}
                </div>
              </div>

              <div style={{ marginTop: "10px" }}>
                <h4>Alternative Travel Times:</h4>
                <div style={{ display: "flex", gap: "20px" }}>
                  <div>
                    <strong>Cycling:</strong>{" "}
                    {formatDuration(
                      directions.summary.travel_durations?.cycling ?? 0
                    )}
                  </div>
                  <div>
                    <strong>Walking:</strong>{" "}
                    {formatDuration(
                      directions.summary.travel_durations?.walking ?? 0
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions Section */}
          <div style={{ border: "1px solid #ddd", borderRadius: "8px" }}>
            <h3
              style={{
                padding: "10px 15px",
                margin: 0,
                borderBottom: "1px solid #ddd",
              }}
            >
              Step-by-Step Directions
            </h3>
            <ol style={{ paddingLeft: "0", margin: 0 }}>
              {directions.instructions.map((step, index) => (
                <li
                  key={index}
                  style={{
                    padding: "12px 15px",
                    borderBottom: "1px solid #eee",
                    listStyleType: "none",
                    counterIncrement: "step-counter",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "15px",
                      fontWeight: "bold",
                      color: "#666",
                    }}
                  >
                    {index + 1}.
                  </div>
                  <div style={{ marginLeft: "30px" }}>
                    <div style={{ fontWeight: "bold" }}>
                      {getStepType(step.type)}: {step.instruction}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                        color: "#666",
                        marginTop: "5px",
                        fontSize: "0.9em",
                      }}
                    >
                      <span>Distance: {formatDistance(step.distance)}</span>
                      <span>Time: {formatDuration(step.duration)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default Directions;
