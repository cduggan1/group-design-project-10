import requests  # Importing the requests library to make HTTP requests
import xml.etree.ElementTree as ET  # Importing the XML parsing library

# Function to fetch weather data from the API
def fetch_weather_data(api_url):
    response = requests.get(api_url)  # Sending a GET request to the API
    
    # Checking if the request was successful
    if response.status_code == 200:
        return response.text  # Return the response text (XML data)
    else:
        print(f"Error: Unable to fetch data. Status code: {response.status_code}")
        return None  # Return None if there was an error

# Function to extract weather values from the XML response
def extract_values(xml_data):
    root = ET.fromstring(xml_data)  # Parse the XML data into an ElementTree object
    values = []  # List to store extracted weather values

    # Iterating through all "time" elements in the XML
    for time in root.findall(".//time"):
        temp = time.find(".//temperature")  # Find the temperature element
        cloudiness = time.find(".//cloudiness")  # Find the cloudiness element
        windspeed = time.find(".//windSpeed")  # Find the wind speed element

        # Extract values from the attributes of the elements
        temperature = float(temp.get("value"))  # Convert temperature to float
        cloud = float(cloudiness.get("percent"))  # Convert cloudiness to float
        wind = float(windspeed.get("mps")) * 3.6  # Convert wind speed from mps to km/h

        values.append((temperature, round(cloud), round(wind)))  # Append the extracted values as a tuple

        return values  # Returns only the first extracted value (incorrect placement of return)

    return None  # Returns None if no data was found (but this won't be reached due to the return inside the loop)

# Get user input for latitude and longitude
latitude = input("Latitude: ")
longitude = input("Longitude: ")

# Construct the API URL using the provided latitude and longitude
api_url = (
    "http://openaccess.pf.api.met.ie/metno-wdb2ts/locationforecast?lat=" 
    + latitude + ";long=" + longitude
)

# Fetch the XML weather data
xml_data = fetch_weather_data(api_url)

# If the data was fetched successfully, extract values and print them
if xml_data:
    values = extract_values(xml_data)

    # Check if values were successfully extracted
    if values:
        print(f"Temperature: {values[0][0]}°C")
        print(f"Cloudiness: {values[0][1]}%")
        print(f"Wind Speed: {values[0][2]} km/h")
    else:
        print("Error: Unable to extract weather data.")
