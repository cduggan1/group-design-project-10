from django.urls import path
from .views import get_weather, get_address, get_directions, get_weather_alerts, get_solar

urlpatterns = [
    path('weather/', get_weather),
    path('address/', get_address),
    path('directions/', get_directions),
    path('solar/', get_solar),
    path('weather-alerts/', get_weather_alerts),
]
