FROM python:3.11

WORKDIR /app

RUN apt-get update && apt-get install -y \
    binutils libproj-dev gdal-bin

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt

COPY . /app

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--chdir", "/app/weather", "--bind", "0.0.0.0:8000", "weather.wsgi"]
