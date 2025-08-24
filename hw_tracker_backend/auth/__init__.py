import logging
import azure.functions as func
from azure.cosmos import CosmosClient
import os
import json
import jwt
import datetime
import hashlib
from typing import Dict, Any

# Environment variables
COSMOS_CONN_STRING = os.environ["COSMOS_CONN_STRING"]
DATABASE_NAME = os.environ["COSMOS_DB"]
CONTAINER_NAME = "users"  # Separate container for users
JWT_SECRET = os.environ["JWT_SECRET"]

# Initialize Cosmos DB client
client = CosmosClient.from_connection_string(COSMOS_CONN_STRING)
database = client.get_database_client(DATABASE_NAME)
users_container = database.get_container_client(CONTAINER_NAME)

def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return hash_password(password) == hashed

def generate_jwt(username: str) -> str:
    """Generate a JWT token for the user"""
    payload = {
        "sub": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def create_user_container_if_not_exists():
    """Create the users container if it doesn't exist"""
    try:
        users_container.read()
    except:
        # Container doesn't exist, create it
        database.create_container(
            id=CONTAINER_NAME,
            partition_key_path="/username"
        )

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Main function to handle auth requests"""
    try:
        # Ensure users container exists
        create_user_container_if_not_exists()
        
        # Get the action from route parameters
        action = req.route_params.get('action')
        
        if not action:
            return func.HttpResponse(
                "Missing action parameter", 
                status_code=400
            )
        
        # Handle different auth actions
        if action == "register":
            return handle_register(req)
        elif action == "login":
            return handle_login(req)
        else:
            return func.HttpResponse(
                f"Unknown action: {action}", 
                status_code=400
            )
            
    except Exception as e:
        logging.error(f"Auth error: {str(e)}")
        return func.HttpResponse(
            f"Internal server error: {str(e)}", 
            status_code=500
        )

def handle_register(req: func.HttpRequest) -> func.HttpResponse:
    """Handle user registration"""
    try:
        body = req.get_json()
        username = body.get("username")
        password = body.get("password")
        
        if not username or not password:
            return func.HttpResponse(
                "Missing username or password", 
                status_code=400
            )
        
        # Check if user already exists
        query = "SELECT * FROM c WHERE c.username = @username"
        existing_users = list(users_container.query_items(
            query=query,
            parameters=[{"name": "@username", "value": username}],
            enable_cross_partition_query=True
        ))
        
        if existing_users:
            return func.HttpResponse(
                "Username already exists", 
                status_code=409
            )
        
        # Create new user
        user = {
            "id": username,
            "username": username,
            "passwordHash": hash_password(password),
            "createdAt": datetime.datetime.utcnow().isoformat()
        }
        
        users_container.create_item(user)
        
        # Generate JWT token
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
        logging.error(f"Registration error: {str(e)}")
        return func.HttpResponse(
            f"Registration failed: {str(e)}", 
            status_code=500
        )

def handle_login(req: func.HttpRequest) -> func.HttpResponse:
    """Handle user login"""
    try:
        body = req.get_json()
        username = body.get("username")
        password = body.get("password")
        
        if not username or not password:
            return func.HttpResponse(
                "Missing username or password", 
                status_code=400
            )
        
        # Find user in database
        query = "SELECT * FROM c WHERE c.username = @username"
        users = list(users_container.query_items(
            query=query,
            parameters=[{"name": "@username", "value": username}],
            enable_cross_partition_query=True
        ))
        
        if not users:
            return func.HttpResponse(
                "Invalid credentials", 
                status_code=401
            )
        
        user = users[0]
        
        # Verify password
        if not verify_password(password, user["passwordHash"]):
            return func.HttpResponse(
                "Invalid credentials", 
                status_code=401
            )
        
        # Generate JWT token
        token = generate_jwt(username)
        
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
        logging.error(f"Login error: {str(e)}")
        return func.HttpResponse(
            f"Login failed: {str(e)}", 
            status_code=500
        )
