import requests
import platform
import xml.etree.ElementTree as ET
import json
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.contrib.gis.geos import Point
from ..models import WeatherAlert


# Gets the weather from the Met Éireann API for given coordinates, and returns five values:
#   Temperature (in degrees Celsius)
#   Cloudiness (as a percentage)
#   Wind speed in kilometres per hour
#   Wind direction as an abbreviation e.g. SW
#   Timestamp
#   Rain forecast in millimetres
@csrf_exempt
def get_weather(request):
    if request.method == "GET":
        lat = request.GET.get("lat")
        lon = request.GET.get("lon")

        if not lat or not lon:
            return JsonResponse({"error": "Latitude and longitude required"}, status=400)

        api_url = f"http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat={lat};long={lon}"
        response = requests.get(api_url)

        if response.status_code != 200:
            return JsonResponse({"error": "Failed to fetch weather data"}, status=response.status_code)

        xml_data = response.text
        root = ET.fromstring(xml_data)

        values = []
        time_elements = root.findall(".//time")
        if len(time_elements) > 48:
            for x in range(0,24):
                time = time_elements[(x*2)]

                forecast_time = time.get("from")
                dt = datetime.strptime(forecast_time, "%Y-%m-%dT%H:%M:%SZ")
                if platform.system() == "Windows":
                    formatted_time = dt.strftime("%I %p").lstrip("0")
                else:
                    formatted_time = dt.strftime("%-I %p")

                temp = time.find(".//temperature")
                cloudiness = time.find(".//cloudiness")
                windspeed = time.find(".//windSpeed")
                winddirection = time.find(".//windDirection")

                temperature = float(temp.get("value"))
                cloud = float(cloudiness.get("percent"))
                wind = float(windspeed.get("mps")) * 3.6
                direction = winddirection.get("name")

                rain_time = time_elements[(x*2)+1]
                precipitation = rain_time.find(".//precipitation")
                mm = float(precipitation.get("value"))

                values.append({
                    "temperature": temperature,
                    "cloudiness": round(cloud),
                    "wind_speed": round(wind),
                    "wind_direction": direction,
                    "time": formatted_time,
                    "rain": mm
                })

            return JsonResponse(values, safe=False)


# Gets the sunrise and sunset values for today at given coordinates, and returns two values:
#   Sunrise time
#   Sunset time
def get_solar(request):
    if request.method == "GET":
        lat = request.GET.get("lat")
        lon = request.GET.get("lon")

        if not lat or not lon:
            return JsonResponse({"error": "Latitude and longitude required"}, status=400)

        api_url = f"https://api.sunrise-sunset.org/json?lat={lon}&lng={lon}"
        response = requests.get(api_url)

        if response.status_code != 200:
            return JsonResponse({"error": "Failed to fetch solar data"}, status=response.status_code)

        
        data = response.text
        data = json.loads(response.text)

        values = []
        sunrise_time = data["results"]["sunrise"]
        sunset_time = data["results"]["sunset"]
        values.append({"rise": sunrise_time, "set": sunset_time})
        return JsonResponse(values, safe=False)

@csrf_exempt
def get_weather_alerts(request):
    if request.method == "GET":
        lat = request.GET.get("lat")
        lon = request.GET.get("lon")
        
        if not lat or not lon:
            return JsonResponse({"error": "Latitude and longitude required"}, status=400)
            
        # Create point from coordinates
        user_location = Point(float(lon), float(lat))
        
        # Get active alerts within 50km radius
        alerts = WeatherAlert.objects.filter(
            is_active=True,
            location__distance_lte=(user_location, D(km=50))
        ).values(
            'title', 
            'description', 
            'severity',
            'start_time',
            'end_time'
        )
        
        return JsonResponse(list(alerts), safe=False)