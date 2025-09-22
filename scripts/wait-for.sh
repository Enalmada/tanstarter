#!/bin/sh

# Loop until pg_isready returns a success status inside the db container
until docker exec postgres_tanstarter pg_isready -U postgres > /dev/null 2>&1
do
  echo "Waiting for Postgres database to be ready inside the container..."
  sleep 1
done

echo "Postgres is up and ready to accept connections!"