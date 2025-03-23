import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Point
from ..models import UserWeatherAlert

@csrf_exempt
def user_weather_alerts(request):
    """
    GET: Retrieves all user weather alerts
    POST: Creates a new user weather alert
    """
    if request.method == "GET":
        alerts = UserWeatherAlert.objects.filter(active=True).values(
            'id', 'name', 'condition', 'threshold', 'comparison', 'active'
        )
        return JsonResponse(list(alerts), safe=False)
    
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            name = data.get('name')
            condition = data.get('condition')
            threshold = data.get('threshold')
            comparison = data.get('comparison')
            
            if not all([name, condition, threshold, comparison]):
                return JsonResponse({"error": "Missing required fields"}, status=400)
            
            lat = data.get('latitude')
            lon = data.get('longitude')
            location = Point(float(lon), float(lat)) if lat and lon else None
            
            alert = UserWeatherAlert.objects.create(
                name=name,
                condition=condition,
                threshold=float(threshold),
                comparison=comparison,
                location=location
            )
            
            return JsonResponse({
                "id": alert.id,
                "name": alert.name,
                "condition": alert.condition,
                "threshold": alert.threshold,
                "comparison": alert.comparison,
                "active": alert.active
            }, status=201)
            
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def user_weather_alert_detail(request, alert_id):
    """
    GET: Retrieves a specific user weather alert
    PUT: Updates a specific user weather alert
    DELETE: Deletes a specific user weather alert
    """
    try:
        alert = UserWeatherAlert.objects.get(id=alert_id)
    except UserWeatherAlert.DoesNotExist:
        return JsonResponse({"error": "Alert not found"}, status=404)
    
    if request.method == "GET":
        return JsonResponse({
            "id": alert.id,
            "name": alert.name,
            "condition": alert.condition,
            "threshold": alert.threshold,
            "comparison": alert.comparison,
            "active": alert.active
        })
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            if 'name' in data:
                alert.name = data['name']
            if 'condition' in data:
                alert.condition = data['condition']
            if 'threshold' in data:
                alert.threshold = float(data['threshold'])
            if 'comparison' in data:
                alert.comparison = data['comparison']
            if 'active' in data:
                alert.active = data['active']
            
            alert.save()
            return JsonResponse({
                "id": alert.id,
                "name": alert.name,
                "condition": alert.condition,
                "threshold": alert.threshold,
                "comparison": alert.comparison,
                "active": alert.active
            })
            
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    
    elif request.method == "DELETE":
        alert.delete()
        return JsonResponse({"message": "Alert deleted successfully"})

@csrf_exempt
def check_user_alerts(request):
    """
    Checks if current weather conditions match any user alerts
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            weather_data = data.get('weather_data')
            
            if not weather_data:
                return JsonResponse({"error": "No weather data provided"}, status=400)
            
            # Get all active alerts
            alerts = UserWeatherAlert.objects.filter(active=True)
            matched_alerts = []
            
            for alert in alerts:
                if check_alert_condition(alert, weather_data):
                    matched_alerts.append({
                        "id": alert.id,
                        "name": alert.name,
                        "message": f"{alert.name}: {alert.get_condition_display()} is {alert.get_comparison_display()} {alert.threshold}"
                    })
            
            return JsonResponse({"matched_alerts": matched_alerts})
            
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

def check_alert_condition(alert, weather_data):
    """Helper function to check if weather data matches alert condition"""
    # Get the first weather data point (current conditions)
    current = weather_data[0] if isinstance(weather_data, list) else weather_data
    
    value = None
    if alert.condition == 'SUNNY':
        value = 100 - current.get('cloudiness', 0)  # Sunny is inverse of cloudiness
    elif alert.condition == 'RAINY':
        value = current.get('rain', 0)
    elif alert.condition == 'WINDY':
        value = current.get('wind_speed', 0)
    elif alert.condition == 'HOT' or alert.condition == 'COLD':
        value = current.get('temperature', 0)
    
    if value is None:
        return False
    
    if alert.comparison == 'GT':
        return value > alert.threshold
    elif alert.comparison == 'LT':
        return value < alert.threshold
    elif alert.comparison == 'EQ':
        return abs(value - alert.threshold) < 0.1  # Approximate equality
    
    return False 