from django.db import models
from django.contrib.gis.db import models as gis_models


from django.contrib.gis.db import models

class Trail(models.Model):
    object_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=8000, null=True, blank=True)
    county = models.CharField(max_length=130, null=True, blank=True)
    activity = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    website = models.URLField(max_length=8000, null=True, blank=True)
    length_km = models.FloatField(null=True, blank=True)
    difficulty = models.CharField(max_length=1000, null=True, blank=True)
    trail_type = models.CharField(max_length=1000, null=True, blank=True)
    ascent_metres = models.CharField(max_length=1000, null=True, blank=True)
    start_point = models.CharField(max_length=1000, null=True, blank=True)
    finish_point = models.CharField(max_length=1000, null=True, blank=True)
    nearest_town_start = models.CharField(max_length=1000, null=True, blank=True)
    nearest_town_finish = models.CharField(max_length=1000, null=True, blank=True)
    public_transport = models.CharField(max_length=1000, null=True, blank=True)
    dogs_allowed = models.CharField(max_length=256, null=True, blank=True)
    management_organisation = models.CharField(max_length=1000, null=True, blank=True)
    location = models.PointField(geography=True, null=True, blank=True)
    route = models.LineStringField(geography=True)

    def __str__(self):
        return self.name or f"Trail {self.object_id}"


class TestGeometry(models.Model):
    point = gis_models.PointField()

    class Meta:
        verbose_name_plural = 'Test Geometries'
        verbose_name = 'Test Geometry' 