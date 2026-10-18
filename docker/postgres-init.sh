#!/bin/bash
set -e
set -u

# Function to create user and database
function create_user_and_database() {
	local database=$1
	local user=$2
	local password=$3
	echo "Creating user '$user' and database '$database'..."
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE USER $user WITH PASSWORD '$password';
	    CREATE DATABASE $database OWNER $user;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $user;
	    \c $database
	    GRANT ALL ON SCHEMA public TO $user;
EOSQL
}

if [ -n "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db_spec in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
		IFS=':' read -r db user pass <<< "$db_spec"
		create_user_and_database $db $user $pass
	done
	echo "Multiple databases created successfully."
fi
