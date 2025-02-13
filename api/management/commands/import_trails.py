import requests
import json
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point, LineString, MultiLineString
from api.models import Trail

ARCGIS_URL = "https://services-eu1.arcgis.com/CltcWyRoZmdwaB7T/ArcGIS/rest/services/GetIrelandActiveTrailRoutes/FeatureServer/0/query"

class Command(BaseCommand):
    help = "Fetches trail data from ArcGIS API and stores it in PostGIS"

    def handle(self, *args, **kwargs):
        params = {
            "where": "1=1",
            "outFields": "*",
            "outSR": "4326",  # WGS 84 (EPSG:4326)
            "f": "geojson"
        }

        self.stdout.write("Fetching data from ArcGIS API...")
        response = requests.get(ARCGIS_URL, params=params)

        if response.status_code != 200:
            self.stderr.write(f"Error fetching data: {response.status_code}")
            return

        data = response.json()
        features = data.get("features", [])

        self.stdout.write(f"Processing {len(features)} features...")

        for feature in features:
            properties = feature.get("properties", {})
            geometry = feature.get("geometry", {})

            if not geometry:
                self.stderr.write(f"Skipping feature {properties.get('OBJECTID')} due to missing geometry")
                continue

            trail_id = properties.get("OBJECTID")

            geom_type = geometry.get("type")
            geom_coords = geometry.get("coordinates")

            if geom_type == "Point":
                geom = Point(geom_coords)
            elif geom_type == "LineString":
                geom = LineString(geom_coords)
            elif geom_type == "MultiLineString":
                try:
                    line_strings = [LineString(part) for part in geom_coords if len(part) > 1]
                    if line_strings:
                        geom = LineString([coord for line in line_strings for coord in line.coords])
                    else:
                        self.stderr.write(f"Skipping MultiLineString for feature {trail_id} due to empty geometry")
                        continue
                except Exception as e:
                    self.stderr.write(f"Error processing MultiLineString for feature {trail_id}: {e}")
                    continue
            else:
                self.stderr.write(f"Skipping feature {trail_id} due to unsupported geometry type: {geom_type}")
                continue

            trail, created = Trail.objects.update_or_create(
                object_id=trail_id,
                defaults={
                    "name": properties.get("Name"),
                    "county": properties.get("County"),
                    "activity": properties.get("Activity"),
                    "description": properties.get("Description"),
                    "website": properties.get("Website"),
                    "length_km": properties.get("LengthKm"),
                    "difficulty": properties.get("Difficulty"),
                    "trail_type": properties.get("TrailType"),
                    "ascent_metres": properties.get("AscentMetres"),
                    "start_point": properties.get("StartPoint"),
                    "finish_point": properties.get("FinishPoint"),
                    "nearest_town_start": properties.get("NearestTownStart"),
                    "nearest_town_finish": properties.get("NearestTownFinish"),
                    "public_transport": properties.get("PublicTransport"),
                    "dogs_allowed": properties.get("DogsAllowed"),
                    "management_organisation": properties.get("ManagementOrganisation"),
                    "location": geom if isinstance(geom, Point) else None,
                    "route": geom if isinstance(geom, LineString) else None,
                }
            )

            if created:
                self.stdout.write(f"Created new trail: {trail.name}")
            else:
                self.stdout.write(f"Updated trail: {trail.name}")

        self.stdout.write(self.style.SUCCESS("Import completed successfully!"))