from django.urls import path
from .views import get_weather

urlpatterns = [
    path('weather/', get_weather),
]
