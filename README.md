**Features**
-
**Weather Forecast:**
- Get weather data (temperature, cloudiness, wind speed, and wind direction) based on latitude and longitude.


**Geolocation:**
- Convert an address into geographical coordinates (latitude and longitude).


**Directions:**
- Get turn-by-turn driving directions between a start and destination location.

**Setup**
-
**Backend (Django):**

    cd back-end
    python manage.py migrate

**Frontend (React):**

    cd frontend
    npm start

The React app will run on http://localhost:3000/, and the Django backend will run on http://127.0.0.1:8000/.


API Endpoints
-
The app exposes three main endpoints for fetching weather, geolocation, and directions data.