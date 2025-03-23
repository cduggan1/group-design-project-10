from django.urls import path
from .views.views import (
    get_address, 
    get_reverse_address,
    get_directions, 
    get_all_trails, 
    get_top_trails_near_location,
    get_top_cycle_trails_near_location,
    get_top_walking_trails_near_location,
    get_location_suggestions
)

from .views.weather import (
    get_weather, 
    get_weather_alerts, 
    get_solar, 
)

from .views.get_top_trails_weather_segments import get_top_trails_weather_segments
from .views.user_weather_alerts import user_weather_alerts, user_weather_alert_detail, check_user_alerts

urlpatterns = [
    path('weather/', get_weather),
    path('address/', get_address),
    path('reverse-address/', get_reverse_address),
    path('directions/', get_directions),
    path('solar/', get_solar),
    path('weather-alerts/', get_weather_alerts),
    path('user-weather-alerts/', user_weather_alerts),
    path('user-weather-alerts/<int:alert_id>/', user_weather_alert_detail),
    path('user-weather-alerts/check/', check_user_alerts),
    path('activities/trails/all', get_all_trails),
    path('activities/trails/top/', get_top_trails_near_location),
    path('activities/trails/top/cycles/', get_top_cycle_trails_near_location),
    path('activities/trails/top/walks/', get_top_walking_trails_near_location),
    path('activities/trails/top/weather-segments/', get_top_trails_weather_segments),
    path('location-suggestions/', get_location_suggestions),
]