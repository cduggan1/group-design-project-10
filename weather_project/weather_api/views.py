from django.shortcuts import render
import requests
import xml.etree.ElementTree as ET
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def get_weather(request):
    if request.method == "GET":
        lat = request.GET.get("lat")
        lon = request.GET.get("lon")

        if not lat or not lon:
            return JsonResponse({"error": "Latitude and longitude required"}, status=400)

        api_url = f"http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat={lat};long={lon}"
        response = requests.get(api_url)

        if response.status_code != 200:
            return JsonResponse({"error": "Failed to fetch weather data"}, status=response.status_code)

        xml_data = response.text
        root = ET.fromstring(xml_data)

        values = []
        for time in root.findall(".//time"):

            temp = time.find(".//temperature")
            cloudiness = time.find(".//cloudiness")
            windspeed = time.find(".//windSpeed")

            temperature = float(temp.get("value"))
            cloud = float(cloudiness.get("percent"))
            wind = float(windspeed.get("mps")) * 3.6

            values.append({"temperature": temperature, "cloudiness": round(cloud), "wind_speed": round(wind)})

            return JsonResponse(values, safe=False)
