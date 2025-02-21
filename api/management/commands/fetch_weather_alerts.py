from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from api.models import WeatherAlert
import requests
from datetime import datetime
import xml.etree.ElementTree as ET
from django.utils.dateparse import parse_datetime

class Command(BaseCommand):
    help = 'Fetches weather alerts from Met Éireann API'

    def handle(self, *args, **options):
        # Met Éireann's actual warnings feed
        api_url = "https://www.met.ie/Open_Data/xml/xWarningPage.xml"
        
        try:
            response = requests.get(api_url)
            if response.status_code != 200:
                raise Exception(f"API returned status code {response.status_code}")

            # Parse XML response
            root = ET.fromstring(response.content)
            
            # Clear old alerts
            WeatherAlert.objects.filter(is_active=True).update(is_active=False)
            
            # Get warning element
            warning = root.find('.//warning')
            if warning is None:
                self.stdout.write(self.style.SUCCESS('No active weather warnings from Met Éireann'))
                # Create a default "No Warnings" alert
                WeatherAlert.objects.create(
                    title="No Active Weather Warnings",
                    description="There are currently no weather warnings in effect for Ireland.",
                    severity="LOW",
                    location=Point(-8.2439, 53.4129),  # Center of Ireland
                    radius_km=200,
                    start_time=datetime.now(),
                    end_time=datetime.now(),
                    is_active=True
                )
                return
                
            global_level_elem = warning.find('.//globalAwarenessLevel/text')
            if global_level_elem is None or not global_level_elem.text:
                global_level = 'Yellow'  # Default to Yellow if not found
            else:
                global_level = global_level_elem.text
            
            # Process each warning type in the warnType array
            warnings_created = False
            for warn_type in warning.findall('.//warnType/warningType'):
                # Default to center of Ireland if coordinates not provided
                lat = 53.4129  # Default latitude for Ireland
                lon = -8.2439  # Default longitude for Ireland
                
                issue_time = warn_type.find('issueTime')
                valid_from = warn_type.find('validFromTime')
                valid_to = warn_type.find('validToTime')
                header = warn_type.find('header')
                warn_text = warn_type.find('warnText')
                
                # Skip if no valid warning text
                if not warn_text or not warn_text.text:
                    continue
                
                # Map severity based on global awareness level
                severity = self.map_severity(global_level)
                
                # Parse dates, with fallbacks
                try:
                    start_time = parse_datetime(valid_from.text) if valid_from and valid_from.text else datetime.now()
                    end_time = parse_datetime(valid_to.text) if valid_to and valid_to.text else datetime.now()
                except (AttributeError, ValueError):
                    start_time = datetime.now()
                    end_time = datetime.now()
                
                WeatherAlert.objects.create(
                    title=header.text if header and header.text else "Weather Warning",
                    description=warn_text.text,
                    severity=severity,
                    location=Point(lon, lat),
                    radius_km=200,  # Cover most of Ireland
                    start_time=start_time,
                    end_time=end_time,
                    is_active=True
                )
                
                warnings_created = True
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created alert: {warn_text.text[:100]}...')
                )
            
            if not warnings_created:
                self.stdout.write(self.style.SUCCESS('No active weather warnings from Met Éireann'))
                # Create a default "No Warnings" alert
                WeatherAlert.objects.create(
                    title="No Active Weather Warnings",
                    description="There are currently no weather warnings in effect for Ireland.",
                    severity="LOW",
                    location=Point(-8.2439, 53.4129),  # Center of Ireland
                    radius_km=200,
                    start_time=datetime.now(),
                    end_time=datetime.now(),
                    is_active=True
                )
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error fetching alerts: {str(e)}'))
            
    def map_severity(self, level):
        # Map Met Éireann warning levels to our model's choices
        mapping = {
            'Yellow': 'LOW',
            'Orange': 'MODERATE',
            'Red': 'SEVERE',
            'Status Yellow': 'LOW',
            'Status Orange': 'MODERATE',
            'Status Red': 'SEVERE'
        }
        return mapping.get(level, 'LOW') 