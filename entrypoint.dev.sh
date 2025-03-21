#!/usr/bin/env bash
set -e

if [ "$DEV_MODE" = "true" ]; then
    echo "Waiting for Postgres to be ready..."
    sleep 5

    echo "Applying migrations..."
    python manage.py migrate --noinput

    # superuser
    echo "Creating superuser (only if none exists yet)..."
    python manage.py shell << END
from django.contrib.auth import get_user_model

User = get_user_model()
username = "user"
email = "user@email.com"
password = "password"

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f"Superuser '{username}' created.")
else:
    print(f"Superuser '{username}' already exists. Skipping...")
END

    # management commands
    echo "Running import_trails..."
    python manage.py import_trails

    echo "Running generate_trail_segments..."
    python manage.py generate_trail_segments

    echo "Running fetch_weather_alerts..."
    python manage.py fetch_weather_alerts
fi

# gunicorn
echo "Starting Gunicorn..."
exec gunicorn --timeout 120 --chdir /app/weather --bind 0.0.0.0:9000 weather.wsgi