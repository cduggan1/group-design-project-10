import requests
import xml.etree.ElementTree as ET

def fetch_weather_data(api_url):
    response = requests.get(api_url)
    
    if response.status_code == 200:
        return response.text
    else:
        print(f"Error: Unable to fetch data. Status code: {response.status_code}")
        return None

def extract_temperature(xml_data):
    root = ET.fromstring(xml_data)
    
    for time in root.findall(".//time"):
        temp = time.find(".//temperature")
        if temp is not None:
            return float(temp.get("value"))   
    return None

def extract_cloudiness(xml_data):
    root = ET.fromstring(xml_data)
    
    for time in root.findall(".//time"):
        cloud = time.find(".//cloudiness")
        if cloud is not None:
            return float(cloud.get("percent"))   
    return None

latitude = input("Latitude: ")
longitude = input("Longitude: ")

api_url = "http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat=" + latitude + ";long=" + longitude
xml_data = fetch_weather_data(api_url)

if xml_data:
    temperature = extract_temperature(xml_data)
    print(f"Temperature: {temperature}°C")

    cloudiness = extract_cloudiness(xml_data)
    print(f"Cloudiness: {cloudiness}%")
