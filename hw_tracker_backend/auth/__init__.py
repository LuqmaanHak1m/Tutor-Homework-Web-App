import logging
import azure.functions as func
from azure.cosmos import CosmosClient
import os
import json
import jwt
import datetime
import hashlib
from typing import Dict, Any

# Configure logging format (optional)
logging.basicConfig(level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s")

# Environment variables
COSMOS_CONN_STRING = os.environ.get("COSMOS_CONN_STRING")
DATABASE_NAME = os.environ.get("COSMOS_DB")
JWT_SECRET = os.environ.get("JWT_SECRET")

if not COSMOS_CONN_STRING or not DATABASE_NAME or not JWT_SECRET:
    logging.critical(
        "Missing required environment variables. "
        f"COSMOS_CONN_STRING={bool(COSMOS_CONN_STRING)}, "
        f"DATABASE_NAME={bool(DATABASE_NAME)}, "
        f"JWT_SECRET={bool(JWT_SECRET)}"
    )
    raise RuntimeError("Missing required environment variables")

CONTAINER_NAME = "users"

# Initialize Cosmos DB client
try:
    client = CosmosClient.from_connection_string(COSMOS_CONN_STRING)
    database = client.get_database_client(DATABASE_NAME)
    users_container = database.get_container_client(CONTAINER_NAME)
    logging.info(f"Connected to Cosmos DB database '{DATABASE_NAME}', container '{CONTAINER_NAME}'")
except Exception as e:
    logging.exception("Failed to initialize Cosmos DB client")
    raise

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def generate_jwt(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def create_user_container_if_not_exists():
    try:
        users_container.read()
        logging.info("Verified users container exists")
    except Exception:
        logging.warning("Users container not found, creating it now...")
        try:
            database.create_container(
                id=CONTAINER_NAME,
                partition_key_path="/username"
            )
            logging.info("Users container created successfully")
        except Exception as e:
            logging.exception("Failed to create users container")
            raise

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        logging.info("Auth function triggered")
        create_user_container_if_not_exists()

        action = req.route_params.get("action")
        logging.info(f"Action requested: {action}")

        if not action:
            return func.HttpResponse("Missing action parameter", status_code=400)

        if action == "register":
            return handle_register(req)
        elif action == "login":
            return handle_login(req)
        else:
            logging.warning(f"Unknown action: {action}")
            return func.HttpResponse(f"Unknown action: {action}", status_code=400)

    except Exception as e:
        logging.exception("Fatal error in auth function")
        return func.HttpResponse(f"Internal server error: {str(e)}", status_code=500)

def handle_register(req: func.HttpRequest) -> func.HttpResponse:
    try:
        logging.info("Processing user registration request")
        body = req.get_json()
        username = body.get("username")
        password = body.get("password")

        if not username or not password:
            logging.warning("Missing username or password during registration")
            return func.HttpResponse("Missing username or password", status_code=400)

        query = "SELECT * FROM c WHERE c.username = @username"
        existing_users = list(users_container.query_items(
            query=query,
            parameters=[{"name": "@username", "value": username}],
            enable_cross_partition_query=True
        ))
        logging.info(f"User lookup for '{username}' returned {len(existing_users)} results")

        if existing_users:
            logging.warning(f"Registration attempt with existing username: {username}")
            return func.HttpResponse("Username already exists", status_code=409)

        user = {
            "id": username,
            "username": username,
            "passwordHash": hash_password(password),
            "createdAt": datetime.datetime.utcnow().isoformat()
        }

        users_container.create_item(user)
        logging.info(f"User '{username}' registered successfully")

        token = generate_jwt(username)

        return func.HttpResponse(
            json.dumps({
                "message": "User registered successfully",
                "token": token,
                "username": username
            }),
            status_code=201,
            mimetype="application/json"
        )

    except Exception as e:
        logging.exception("Registration error")
        return func.HttpResponse(f"Registration failed: {str(e)}", status_code=500)

def handle_login(req: func.HttpRequest) -> func.HttpResponse:
    try:
        logging.info("Processing user login request")
        body = req.get_json()
        username = body.get("username")
        password = body.get("password")

        if not username or not password:
            logging.warning("Missing username or password during login")
            return func.HttpResponse("Missing username or password", status_code=400)

        query = "SELECT * FROM c WHERE c.username = @username"
        users = list(users_container.query_items(
            query=query,
            parameters=[{"name": "@username", "value": username}],
            enable_cross_partition_query=True
        ))
        logging.info(f"Login lookup for '{username}' returned {len(users)} results")

        if not users:
            logging.warning(f"Login attempt failed: user '{username}' not found")
            return func.HttpResponse("Invalid credentials", status_code=401)

        user = users[0]

        if not verify_password(password, user["passwordHash"]):
            logging.warning(f"Login failed for user '{username}': invalid password")
            return func.HttpResponse("Invalid credentials", status_code=401)

        token = generate_jwt(username)
        logging.info(f"User '{username}' logged in successfully")

        return func.HttpResponse(
            json.dumps({
                "message": "Login successful",
                "token": token,
                "username": username
            }),
            status_code=200,
            mimetype="application/json"
        )

    except Exception as e:
        logging.exception("Login error")
        return func.HttpResponse(f"Login failed: {str(e)}", status_code=500)
