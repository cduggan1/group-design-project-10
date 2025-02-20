from django.urls import path
from .views import get_weather, get_address, get_directions, get_weather_alerts, get_solar, get_all_trails, get_top_trails_near_location

urlpatterns = [
    path('weather/', get_weather),
    path('address/', get_address),
    path('directions/', get_directions),
    path('solar/', get_solar),
    path('weather-alerts/', get_weather_alerts),
    path('activities/trails/all', get_all_trails),
    path('activities/trails/top/', get_top_trails_near_location)
]
