from django.urls import path
from .views import get_weather, get_address, get_directions, get_all_trails

urlpatterns = [
    path('weather/', get_weather),
    path('address/', get_address),
    path('directions/', get_directions),
    path('activities/trails/all', get_all_trails)
]
