from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from api.models import WeatherAlert
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Creates current test weather alerts for development'

    def handle(self, *args, **options):
       
        WeatherAlert.objects.filter(is_active=True).update(is_active=False)
        
        
        now = timezone.now()
        tomorrow = now + timedelta(days=1)
        tomorrow_evening = tomorrow.replace(hour=20, minute=0, second=0, microsecond=0)
        
        
        dublin_alert = WeatherAlert.objects.create(
            title='Status Yellow - Rain and Wind warning',
            description='Heavy rainfall expected with accumulations of 20 to 30mm. Strong winds with mean speeds of 50 to 65 km/h and gusts up to 100 km/h.',
            severity='LOW',
            location=Point(-7.397039, 52.843995), 
            radius_km=20,  
            start_time=now,
            end_time=tomorrow_evening,
            is_active=True
        )
        
        self.stdout.write(self.style.SUCCESS(
            f'Created new test alert for Dublin (ID: {dublin_alert.id}) valid from {now.strftime("%d/%m/%Y, %H:%M:%S")} '
            f'to {tomorrow_evening.strftime("%d/%m/%Y, %H:%M:%S")}'
        ))
        
        
        self.stdout.write(f'Alert location: {dublin_alert.location.x}, {dublin_alert.location.y}')
        self.stdout.write(f'Alert radius: {dublin_alert.radius_km} km') 