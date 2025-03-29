import React, { useState } from "react";

const TrailWeatherPreferences = ({ onChange }) => {
  const [preferences, setPreferences] = useState({
    noRain: true,
    notWindy: true,
    preferSunny: false,
    minTemp: 10,
    maxTemp: 25,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : Number(value);

    const updated = { ...preferences, [name]: newValue };
    setPreferences(updated);
    onChange(updated);
  };

  return (
    <div style={{ margin: "20px 0", padding: "15px", border: "1px solid #ddd", borderRadius: "6px" }}>
      <h4>Trail Weather Preferences</h4>
      <label>
        <input type="checkbox" name="noRain" checked={preferences.noRain} onChange={handleChange} />
        No Rain
      </label>
      <br />
      <label>
        <input type="checkbox" name="notWindy" checked={preferences.notWindy} onChange={handleChange} />
        Not Windy (under 25 km/h)
      </label>
      <br />
      <label>
        <input type="checkbox" name="preferSunny" checked={preferences.preferSunny} onChange={handleChange} />
        Prefer Sunny (cloud cover under 40%)
      </label>
      <br />
      <label>
        Temperature Range: &nbsp;
        <input
          type="number"
          name="minTemp"
          value={preferences.minTemp}
          onChange={handleChange}
          style={{ width: "60px" }}
        />
        °C to
        <input
          type="number"
          name="maxTemp"
          value={preferences.maxTemp}
          onChange={handleChange}
          style={{ width: "60px", marginLeft: "8px" }}
        />
        °C
      </label>
    </div>
  );
};

export default TrailWeatherPreferences;
export const getExclusionReason = (weather, prefs) => {
    if (!prefs) return null;
    if (prefs.noRain && weather.rain > 0) return "Too much rain";
    if (prefs.notWindy && weather.wind_speed > 25) return "Too windy";
    if (prefs.preferSunny && weather.cloudiness > 40) return "Too cloudy";
    if (weather.temperature < prefs.minTemp) return "Too cold";
    if (weather.temperature > prefs.maxTemp) return "Too hot";
    return null;
  };