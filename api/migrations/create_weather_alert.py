from django.contrib.gis.db import models
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='WeatherAlert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('severity', models.CharField(choices=[('LOW', 'Low'), ('MODERATE', 'Moderate'), ('SEVERE', 'Severe'), ('EXTREME', 'Extreme')], max_length=10)),
                ('location', models.PointField(geography=True, srid=4326)),
                ('radius_km', models.FloatField()),
                ('start_time', models.DateTimeField()),
                ('end_time', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_active', models.BooleanField(default=True)),
            ],
        ),
    ] 