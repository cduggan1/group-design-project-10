from django.contrib import admin
from .models import Trail, TrailSegment, WeatherAlert
from .forms import TrailSegmentInlineForm
from leaflet.admin import LeafletGeoAdmin

class TrailSegmentInline(admin.TabularInline):
    model = TrailSegment
    form = TrailSegmentInlineForm
    extra = 0
    verbose_name_plural = "Trail Segments"
    verbose_name = "Trail Segment"

class TrailAdmin(LeafletGeoAdmin):
    list_display = ["name", "activity", "length_km"]
    inlines = [TrailSegmentInline]

admin.site.register(Trail, TrailAdmin)
admin.site.register(WeatherAlert)
admin.site.register(TrailSegment, LeafletGeoAdmin)