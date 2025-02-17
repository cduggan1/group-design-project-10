from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from api.models import WeatherAlert
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Creates test weather alerts for development'

    def handle(self, *args, **options):
        # Clear existing alerts
        WeatherAlert.objects.filter(is_active=True).update(is_active=False)
        
        # Sample alerts data
        test_alerts = [
            {
                'title': 'Status Yellow - Rain warning',
                'description': 'Heavy rainfall expected with accumulations of 30 to 50mm. Risk of flooding.',
                'severity': 'LOW',
                'lat': 53.4129,
                'lon': -8.2439,
            },
            {
                'title': 'Status Orange - Wind warning',
                'description': 'Storm conditions with mean speeds of 65 to 80 km/h and gusts up to 130 km/h.',
                'severity': 'MODERATE',
                'lat': 53.3498,
                'lon': -6.2603,
            },
            {
                'title': 'Status Red - Coastal flood warning',
                'description': 'Extreme coastal flooding risk. Spring tides combined with storm surge.',
                'severity': 'SEVERE',
                'lat': 51.8969,
                'lon': -8.4863,
            },
        ]
        
        try:
            now = timezone.now()
            for alert in test_alerts:
                WeatherAlert.objects.create(
                    title=alert['title'],
                    description=alert['description'],
                    severity=alert['severity'],
                    location=Point(alert['lon'], alert['lat']),
                    radius_km=200,
                    start_time=now,
                    end_time=now + timedelta(hours=24),
                    is_active=True
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created test alert: {alert["title"]}')
                )
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating test alerts: {str(e)}')) 