# Overview

This app brings together features from several weather forecasting, recreation, and map navigation products. It allows users to search for locations on a map, ask about the weather, and explore various recreational activities all across Ireland, as well as get direction to a location. The app visualises trails on the map and displays weather forecast at various time milestones calculated dynamically based on trail data.

![System Architecture Diagram](docs/sys_arc.png)

**Figure 1:** System Architecture Diagram

# Step by Step

## Run Production (recommended)

To access the deployed app, simply navigate to the link below:

### https://groupdesign10.shor.ink/

## Run Locally

If if you would like to run the app locally instead, follow the instructions below.

Disclaimer: to access our database and external APIs you need to request us an .env file.

### Build
First time or anytime Dockerfiles and docker-compose.yml change:

`docker-compose up --build`


### Run
Every other time do:

`docker-compose up`

And to close the containers:

`docker-compose down`


### Running Migrations

Everytime there are changes to the database models.

For example, make new migrations for the Django app `api`:

``docker exec weather_backend python manage.py makemigrations api``

And migrate:

``docker exec weather_backend python manage.py migrate api``


### Run Django Commands

You can also run Django python commands directly in each container without needing to use `docker exec ...` by opening an interactive shell session:

`docker exec -it weather_backend /bin/bash`

And within that for example you can do directly:

`python manage.py migrate`