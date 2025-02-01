from django.db import models
from django.contrib.gis.db import models as gis_models


class TestGeometry(models.Model):
    point = gis_models.PointField()

    class Meta:
        verbose_name_plural = 'Test Geometries'
        verbose_name = 'Test Geometry' 