import requests
import platform
import xml.etree.ElementTree as ET
import json
from datetime import datetime

from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
from django.core.serializers import serialize
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.conf import settings
from django.contrib.gis.measure import D
from django.contrib.gis.geos import Point
from .models import WeatherAlert

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
        address = data["response"]["features"][0]["properties"]["label"]

        values = []

        values.append({"longitude": longitude, "latitude": latitude, "address": address})
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
    
@csrf_exempt
def get_top_trails_near_location(request):
    """
    Returns the top 5 trails nearest to a given location.
    
    GET parameters:
      - lat: latitude
      - lon: longitude
      
    For each trail, we compute the distance from the given point to its
    'route' field (the closest distance) and return the entire DB object
    (all fields) plus the computed distance.
    """
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=400)

    lat = request.GET.get("lat")
    lon = request.GET.get("lon")
    if not lat or not lon:
        return JsonResponse({"error": "Both lat and lon parameters are required."}, status=400)

    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return JsonResponse({"error": "Invalid lat or lon values."}, status=400)

    user_point = Point(lon, lat, srid=4326)

    trails = Trail.objects.annotate(distance=Distance("route", user_point))\
                          .order_by("distance")[:5]

    geojson_str = serialize("geojson", trails, geometry_field="route")
    geojson_data = json.loads(geojson_str)

    for feature, trail in zip(geojson_data["features"], trails):
        feature["properties"]["distance_m"] = trail.distance.m

    return HttpResponse(json.dumps(geojson_data), content_type="application/json")
