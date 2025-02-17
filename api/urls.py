from django.urls import path
from .views import get_weather, get_address, get_directions, get_weather_alerts

urlpatterns = [
    path('weather/', get_weather),
    path('address/', get_address),
    path('directions/', get_directions),
    path('weather-alerts/', get_weather_alerts),
]
