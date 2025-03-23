from django.core.management.base import BaseCommand
from django.db import connection
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Sets up the UserWeatherAlert model and applies necessary migrations'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting user alerts setup...'))
        
        # Apply migrations
        self.stdout.write('Applying migrations...')
        call_command('migrate')
        
        self.stdout.write(self.style.SUCCESS('User alerts setup complete!')) 