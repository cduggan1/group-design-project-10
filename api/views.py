from django.shortcuts import render
import requests
import platform
import xml.etree.ElementTree as ET
import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
from django.core.serializers import serialize
from datetime import datetime
from django.conf import settings
from .models import Trail

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
        for time in root.findall(".//time"):
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

            values.append({"temperature": temperature, "cloudiness": round(cloud), "wind_speed": round(wind), "wind_direction": direction, "time":formatted_time})
            

            return JsonResponse(values, safe=False)

def get_address(request):
    if request.method == "GET":
        address = request.GET.get("address")

        if not address:
            return JsonResponse({"error": "Address required"}, status=400)

        api_key = settings.LOCATION_API_KEY

        api_url = f"https://api.geocodify.com/v2/geocode?api_key={api_key}&q={address}"
        response = requests.get(api_url)

        if response.status_code != 200:
            return JsonResponse({"error": "Failed to fetch weather data"}, status=response.status_code)

        data = json.loads(response.text)
        coordinates = data["response"]["features"][0]["geometry"]["coordinates"]
        longitude, latitude = coordinates

        values = []
        values.append({"longitude": longitude, "latitude": latitude})
        return JsonResponse(values, safe=False)
    
def get_directions(request):
    if request.method == "GET":
        start = request.GET.get("from")
        destination = request.GET.get("to")
        
        if not start or not destination:
            return JsonResponse({"error": "Locations required"}, status=400)
        
        start = ','.join(start.split(',')[::-1])
        destination = ','.join(destination.split(',')[::-1])


        api_key = settings.DIRECTIONS_API_KEY

        api_url = f"https://api.openrouteservice.org/v2/directions/driving-car?api_key={api_key}&start={start}&end={destination}"
        response = requests.get(api_url)

        if response.status_code != 200:
            return JsonResponse({"error": "Failed to fetch directions"}, status=response.status_code)

        data = json.loads(response.text)
        instructions = []
        for feature in data.get("features", []):
            for segment in feature.get("properties", {}).get("segments", []):
                for step in segment.get("steps", []):
                    instructions.append(step.get("instruction", ""))
        print(instructions)
        return JsonResponse(instructions, safe=False)
    
@csrf_exempt
@cache_page(60 * 60)
def get_all_trails(request):
    """
    Returns all trails as GeoJSON with:
     - geometry = 'route'
     - properties = ['object_id', 'activity', 'length_km', 'difficulty']
    """
    if request.method == "GET":
        trails_qs = Trail.objects.all()
        
        geojson_data = serialize(
            'geojson',
            trails_qs,
            geometry_field='route', 
            fields=('object_id', 'name', 'activity', 'length_km', 'difficulty')
        )
        
        return HttpResponse(geojson_data, content_type='application/json')