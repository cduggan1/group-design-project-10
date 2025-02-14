# Generated by Django 5.1.5 on 2025-02-13 18:14

import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='TestGeometry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('point', django.contrib.gis.db.models.fields.PointField(srid=4326)),
            ],
            options={
                'verbose_name': 'Test Geometry',
                'verbose_name_plural': 'Test Geometries',
            },
        ),
        migrations.CreateModel(
            name='Trail',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('object_id', models.IntegerField(unique=True)),
                ('name', models.CharField(blank=True, max_length=8000, null=True)),
                ('county', models.CharField(blank=True, max_length=130, null=True)),
                ('activity', models.CharField(blank=True, max_length=50, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('website', models.URLField(blank=True, max_length=8000, null=True)),
                ('length_km', models.FloatField(blank=True, null=True)),
                ('difficulty', models.CharField(blank=True, max_length=1000, null=True)),
                ('trail_type', models.CharField(blank=True, max_length=1000, null=True)),
                ('ascent_metres', models.CharField(blank=True, max_length=1000, null=True)),
                ('start_point', models.CharField(blank=True, max_length=1000, null=True)),
                ('finish_point', models.CharField(blank=True, max_length=1000, null=True)),
                ('nearest_town_start', models.CharField(blank=True, max_length=1000, null=True)),
                ('nearest_town_finish', models.CharField(blank=True, max_length=1000, null=True)),
                ('public_transport', models.CharField(blank=True, max_length=1000, null=True)),
                ('dogs_allowed', models.CharField(blank=True, max_length=256, null=True)),
                ('management_organisation', models.CharField(blank=True, max_length=1000, null=True)),
                ('location', django.contrib.gis.db.models.fields.PointField(blank=True, geography=True, null=True, srid=4326)),
                ('route', django.contrib.gis.db.models.fields.LineStringField(geography=True, srid=4326)),
            ],
        ),
    ]
