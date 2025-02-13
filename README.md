# Development

## Build
First time or anytime Dockerfiles and docker-compose.yml change:

`docker-compose up --build`


## Run
Every other time do:

`docker-compose up`

And to close the containers:

`docker-compose down`


## Running Migrations

Everytime there are changes to the database models.

For example, make new migrations for the Django app `api`:

``docker exec weather_backend python manage.py makemigrations api``

And migrate:

``docker exec weather_backend python manage.py migrate api``


## Run Django Commands

You can also run Django python commands directly in each container without needing to use `docker exec ...` by opening an interactive shell session:

`docker exec -it weather_backend /bin/bash`

And within that for example you can do directly:

`python manage.py migrate`