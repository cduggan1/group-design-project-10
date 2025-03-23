from django.contrib.gis.db import models
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('api', 'create_weather_alert'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserWeatherAlert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('condition', models.CharField(choices=[('SUNNY', 'Sunny (Low cloudiness)'), ('RAINY', 'Rainy (Precipitation)'), ('WINDY', 'Windy (High wind speed)'), ('HOT', 'Hot temperature'), ('COLD', 'Cold temperature')], max_length=20)),
                ('threshold', models.FloatField(help_text='Threshold value for the condition')),
                ('comparison', models.CharField(choices=[('GT', 'Greater than'), ('LT', 'Less than'), ('EQ', 'Equal to')], default='GT', max_length=2)),
                ('active', models.BooleanField(default=True)),
                ('location', models.PointField(blank=True, geography=True, null=True, srid=4326)),
            ],
        ),
    ] 