from django.urls import path
from .views import get_weather, get_address

urlpatterns = [
    path('weather/', get_weather),
    path('address/', get_address),
]
