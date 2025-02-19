from django.urls import path
from .views import *

urlpatterns = [
    path('weather/', get_weather),
    path('address/', get_address),
    path('directions/', get_directions),
    path('activities/trails/all', get_all_trails),
    path('activities/trails/top/', get_top_trails_near_location)
]
