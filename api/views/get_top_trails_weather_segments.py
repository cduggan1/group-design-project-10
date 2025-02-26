import json
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from django.http import JsonResponse
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.views.decorators.csrf import csrf_exempt
from ..models import Trail

def parse_parameters(request):
    """
    Parse and validate the GET parameters: lat, lon, and datetime.
    Returns lat (float), lon (float), and base_dt (datetime).
    """
    lat = request.GET.get("lat")
    lon = request.GET.get("lon")
    dt_str = request.GET.get("datetime")
    activity_type = request.GET.get("activity_type")
    max_distance = request.GET.get("max_distance", 50)
    if not lat or not lon or not dt_str:
        raise ValueError("lat, lon, and datetime are required.")
    try:
        lat = float(lat)
        lon = float(lon)
        base_dt = datetime.fromisoformat(dt_str)
        max_distance = float(max_distance)
    except Exception as e:
        raise ValueError(f"Invalid parameter: {e}")
    return lat, lon, base_dt, activity_type, max_distance

def fetch_weather_at(lat, lon, target_dt):
    """
    Fetch weather forecast for a given latitude, longitude, and target datetime.
    Uses an external weather API and returns the forecast (or None if unavailable).
    """
    api_url = f"http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat={lat};long={lon}"
    response = requests.get(api_url)
    if response.status_code != 200:
        return None
    try:
        root = ET.fromstring(response.text)
    except Exception:
        return None

    best_forecast = None
    best_diff = None
    for time_elem in root.findall(".//time"):
        forecast_time_str = time_elem.get("from")
        try:
            forecast_dt = datetime.strptime(forecast_time_str, "%Y-%m-%dT%H:%M:%SZ")
        except Exception:
            continue
        diff = abs((forecast_dt - target_dt).total_seconds())
        if best_diff is None or diff < best_diff:
            best_diff = diff
            best_forecast = time_elem

    if best_forecast is not None:
        try:
            temp_elem = best_forecast.find(".//temperature")
            cloud_elem = best_forecast.find(".//cloudiness")
            wind_elem = best_forecast.find(".//windSpeed")
            wind_dir_elem = best_forecast.find(".//windDirection")
            precip_elem = best_forecast.find(".//precipitation")
            forecast = {
                "temperature": float(temp_elem.get("value")) if temp_elem is not None else None,
                "cloudiness": round(float(cloud_elem.get("percent"))) if cloud_elem is not None else None,
                "wind_speed": round(float(wind_elem.get("mps")) * 3.6) if wind_elem is not None else None,
                "wind_direction": wind_dir_elem.get("name") if wind_dir_elem is not None else None,
                "forecast_time": best_forecast.get("from"),
                "rain": float(precip_elem.get("value")) if (precip_elem is not None and precip_elem.get("value")) else 0.0,
            }
            return forecast
        except Exception:
            return None
    return None

def get_top_trails(activity_type, user_point, limit=5, max_distance_km=50):
    """
    Retrieve the top `limit` trails nearest to the provided user_point,
    filtering out trails beyond max_distance_km.
    """
    max_distance_filter = D(km=max_distance_km)
    trails = Trail.objects.filter(route__distance_lte=(user_point, max_distance_filter))

    if activity_type == "Cycling":
        trails = trails.filter(activity="Cycling")
    elif activity_type == "Walking":
        trails = trails.filter(activity="Walking")

    trails = trails.annotate(distance=Distance("route", user_point))\
                   .order_by("distance")[:limit]
    return trails


def get_segments_for_trail(trail, base_dt):
    """
    For a given trail, process its segments.
    Each segment is enriched with:
      - forecast_datetime: base_dt plus the segment's time offset.
      - weather: forecast data from fetch_weather_at().
      - coordinates: the segment point's coordinates.
    Returns a list of segment dictionaries.
    """
    segments_list = []
    segments_qs = trail.segments.all().order_by("segment_index")
    for seg in segments_qs:
        seg_dt = base_dt + seg.start_time_offset
        seg_lat = seg.segment_point.y  # GEOS stores points as (x, y) = (lon, lat)
        seg_lon = seg.segment_point.x
        forecast = fetch_weather_at(seg_lat, seg_lon, seg_dt)
        segments_list.append({
            "forecast_datetime": seg_dt.isoformat(),
            "weather": forecast,
            "coordinates": list(seg.segment_point.coords),
        })
    return segments_list

def trail_to_geojson_feature(trail, segments_list):
    """
    Converts a Trail object (with its segments) to a GeoJSON feature.
    The trail's route is used as the geometry, and its properties include
    a list of segments enriched with weather data.
    """
    try:
        route_geojson = json.loads(trail.route.geojson)
    except Exception:
        route_geojson = None
    feature = {
        "type": "Feature",
        "geometry": route_geojson,
        "properties": {
            "object_id": trail.object_id,
            "name": trail.name,
            "activity": trail.activity,
            "length_km": trail.length_km,
            "distance_m": trail.distance.m,
            "segments": segments_list,
        }
    }
    return feature

@csrf_exempt
def get_top_trails_weather_segments(request):
    """
    GET endpoint that returns the top 5 trails closest to a given location
    along with each trail's segments. Each segment includes its point,
    an adjusted datetime (base datetime + segment offset), and weather data.
    
    GET parameters:
      - lat: latitude
      - lon: longitude
      - datetime: base datetime (ISO 8601 string)
      - activity_type
    Returns a GeoJSON FeatureCollection.
    """
    if request.method != "GET":
        return JsonResponse({"error": "GET method required"}, status=400)
    try:
        lat, lon, base_dt, activity_type, max_distance_km = parse_parameters(request)
    except ValueError as e:
        return JsonResponse({"error": str(e)}, status=400)
    
    user_point = Point(lon, lat, srid=4326)
    trails = get_top_trails(activity_type, user_point, limit=5, max_distance_km=max_distance_km)
    
    features = []
    for trail in trails:
        segments_list = get_segments_for_trail(trail, base_dt)
        feature = trail_to_geojson_feature(trail, segments_list)
        features.append(feature)
    
    feature_collection = {
        "type": "FeatureCollection",
        "features": features,
    }
    
    return JsonResponse(feature_collection)