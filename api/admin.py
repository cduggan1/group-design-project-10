from django.contrib import admin

# Register your models here.
from .models import TestGeometry
from leaflet.admin import LeafletGeoAdmin

admin.site.register(TestGeometry, LeafletGeoAdmin)
