import requests
import json


from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
from django.core.serializers import serialize
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.conf import settings
from django.core.cache import cache
from django.contrib.gis.geos import Point
from ..models import Trail
from ..utils.api_cache import APICache


def get_address(request):
    if request.method == "GET":
        address = request.GET.get("address")

        if not address:
            return JsonResponse({"error": "Address required"}, status=400)

        api_key = settings.LOCATION_API_KEY

        api_url = f"https://api.geocodify.com/v2/geocode?api_key={api_key}&q={address}"

        data = APICache.get_cached_response(api_url, timeout=604800)
        if not data:
            return JsonResponse({"error": "Failed to fetch weather data"}, status=500)

        coordinates = data["response"]["features"][0]["geometry"]["coordinates"]
        longitude, latitude = coordinates
        address = data["response"]["features"][0]["properties"]["label"]

        values = []

        values.append({"longitude": longitude, "latitude": latitude, "address": address})
        return JsonResponse(values, safe=False)
    
def get_reverse_address(request):
    if request.method == "GET":
        latitude = request.GET.get("latitude")
        longitude = request.GET.get("longitude")

        if not latitude or not longitude:
            return JsonResponse({"error": "Latitude and Longitude required"}, status=400)

        api_key = settings.LOCATION_API_KEY

        api_url = f"https://api.geocodify.com/v2/reverse?api_key={api_key}&lat={latitude}&lng={longitude}"

        data = APICache.get_cached_response(api_url, timeout=604800)
        if not data:
            return JsonResponse({"error": "Failed to fetch weather data"}, status=500)
        print("DEBUG: ", data)
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid response format from API: " + data}, status=500)


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

        data = APICache.get_cached_response(api_url, timeout=600)
        if not data:
            return JsonResponse({"error": "Failed to fetch directions"}, status=500)
        
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid response format from API: " + data}, status=500)
            
        
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
        # Bit of a hack
        cache_key = "all_trails_geojson"
        geojson_data = cache.get(cache_key)

        if not geojson_data:
            trails_qs = Trail.objects.all()
            geojson_data = serialize(
                'geojson',
                trails_qs,
                geometry_field='route', 
                fields=('object_id', 'name', 'activity', 'length_km', 'difficulty')
            )
            cache.set(cache_key, geojson_data, 3600) # Cache for 1 hour
        
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

    cache_key = f"top_trails_{lat}_{lon}"
    geojson_data = cache.get(cache_key)

    if not geojson_data:
        user_point = Point(lon, lat, srid=4326)
        trails = Trail.objects.annotate(distance=Distance("route", user_point)) \
                          .order_by("distance")[:5]

        geojson_str = serialize("geojson", trails, geometry_field="route")
        geojson_data = json.loads(geojson_str)

        for feature, trail in zip(geojson_data["features"], trails):
            feature["properties"]["distance_m"] = trail.distance.m
        geojson_data = json.dumps(geojson_data)
        cache.set(cache_key, geojson_data, 1800)
    else:
        geojson_data = json.loads(geojson_data)

    return HttpResponse(geojson_data, content_type="application/json")
    
@csrf_exempt
def get_top_cycle_trails_near_location(request):
    """
    Returns the top 5 cycling trails nearest to a given location.
    
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

    cache_key = f"top_cycle_trails_{lat}_{lon}"
    geojson_data = cache.get(cache_key)
    if not geojson_data:
        user_point = Point(lon, lat, srid=4326)

        trails = Trail.objects.filter(activity="Cycling") \
                            .annotate(distance=Distance("route", user_point)) \
                            .order_by("distance")[:5]


        geojson_str = serialize("geojson", trails, geometry_field="route")
        geojson_data = json.loads(geojson_str)

        for feature, trail in zip(geojson_data["features"], trails):
            feature["properties"]["distance_m"] = trail.distance.m
        geojson_data = json.dumps(geojson_data)
        cache.set(cache_key, geojson_data, 1800)
    else:
        geojson_data = json.loads(geojson_data)

    return HttpResponse(geojson_data, content_type="application/json")


@csrf_exempt
def get_top_walking_trails_near_location(request):
    """
    Returns the top 5 walking trails nearest to a given location.
    
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

    cache_key = f"top_walking_trails_{lat}_{lon}"
    geojson_data = cache.get(cache_key)
    if not geojson_data:
        user_point = Point(lon, lat, srid=4326)

        trails = Trail.objects.filter(activity="Walking") \
                            .annotate(distance=Distance("route", user_point)) \
                            .order_by("distance")[:5]


        geojson_str = serialize("geojson", trails, geometry_field="route")
        geojson_data = json.loads(geojson_str)

        for feature, trail in zip(geojson_data["features"], trails):
            feature["properties"]["distance_m"] = trail.distance.m
        geojson_data = json.dumps(geojson_data)
        cache.set(cache_key, geojson_data, 1800)
    else:
        geojson_data = json.loads(geojson_data)

    return HttpResponse(geojson_data, content_type="application/json")

@csrf_exempt
def get_location_suggestions(request):
    if request.method == "GET":
        query = request.GET.get("query", "")
        
        if not query or len(query) < 2:
            return JsonResponse([], safe=False)
            
        # Use the geocodify API with improved fuzzy search parameters
        api_key = settings.LOCATION_API_KEY
        cache_key = f"location_suggestions_{query}"
        suggestions = cache.get(cache_key)
        if suggestions is not None:
            return JsonResponse(suggestions, safe=False)
        
        # Try with higher fuzzy value for better typo tolerance
        api_url = f"https://api.geocodify.com/v2/suggest?api_key={api_key}&q={query}&fuzzy=2&bias=ie"
        
        try:
            data = APICache.get_cached_response(api_url, timeout=3600)
            if not data:
                return JsonResponse([], safe=False)

            suggestions = []
            
            for feature in data.get("response", {}).get("features", []):
                props = feature.get("properties", {})
                suggestions.append({
                    "id": props.get("id"),
                    "label": props.get("label"),
                    "value": props.get("label"),
                    "longitude": feature["geometry"]["coordinates"][0],
                    "latitude": feature["geometry"]["coordinates"][1]
                })
            
            # If we have no results or very few, also try with common Irish city spelling corrections
            if len(suggestions) < 2:
                common_cities = {
                    "galwy": "galway", 
                    "dubln": "dublin", 
                    "dablinn": "dublin",
                    "cark": "cork", 
                    "limerik": "limerick",
                    "waterfrd": "waterford",
                    "kilkeny": "kilkenny",
                    "slgo": "sligo"
                }
                
                corrected_query = None
                # Check if the query is a misspelling of a common city
                for misspelled, correct in common_cities.items():
                    if query.lower().startswith(misspelled) or misspelled.startswith(query.lower()):
                        corrected_query = correct
                        break
                
                # If we found a potential correction, try again with the corrected city name
                if corrected_query:
                    corrected_url = f"https://api.geocodify.com/v2/suggest?api_key={api_key}&q={corrected_query}&bias=ie"
                    corrected_response = requests.get(corrected_url)
                    
                    if corrected_response.status_code == 200:
                        corrected_data = json.loads(corrected_response.text)
                        
                        for feature in corrected_data.get("response", {}).get("features", []):
                            props = feature.get("properties", {})
                            # Add a note that this was a correction
                            label = props.get("label")
                            suggestions.append({
                                "id": props.get("id"),
                                "label": f"{label} (Did you mean: {corrected_query.title()}?)",
                                "value": label,
                                "longitude": feature["geometry"]["coordinates"][0],
                                "latitude": feature["geometry"]["coordinates"][1]
                            })
                
            return JsonResponse(suggestions, safe=False)
            
        except Exception as e:
            print(f"Error fetching suggestions: {str(e)}")
            return JsonResponse([], safe=False)