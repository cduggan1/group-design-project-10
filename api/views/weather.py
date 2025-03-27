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
from ..utils.api_cache import APICache


@csrf_exempt
def get_weather(request):
    if request.method == "GET":
        lat = request.GET.get("lat")
        lon = request.GET.get("lon")

        if not lat or not lon:
            return JsonResponse({"error": "Latitude and longitude required"}, status=400)

        api_url = f"http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat={lat};long={lon}"

        cached_data = APICache.get_cached_response(api_url, timeout=900)
    
        if not cached_data:
            return JsonResponse({"error": "Failed to fetch weather data"}, status=500)
        try:
            root = ET.fromstring(cached_data)
        except ET.ParseError:
            return JsonResponse({"error": "Failed to parse weather data"}, status=500)

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

def get_solar(request):
    if request.method == "GET":
        lat = request.GET.get("lat")
        lon = request.GET.get("lon")

        if not lat or not lon:
            return JsonResponse({"error": "Latitude and longitude required"}, status=400)

        api_url = f"https://api.sunrise-sunset.org/json?lat={lat}&lng={lon}"

        cached_data = APICache.get_cached_response(api_url, timeout=43200)
        
        if not cached_data:
            return JsonResponse({"error": "Failed to fetch solar data"}, status=500)

        try:
            sunrise_time = cached_data["results"]["sunrise"]
            sunset_time = cached_data["results"]["sunset"]
            return JsonResponse([{"rise": sunrise_time, "set": sunset_time}], safe=False)
        except (KeyError, TypeError):
            return JsonResponse({"error": "Failed to parse solar data"}, status=500)

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