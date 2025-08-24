import jwt
import os
import logging
import azure.functions as func
from typing import Optional, Dict, Any

JWT_SECRET = os.environ.get("JWT_SECRET")

def validate_jwt_token(auth_header: str) -> Optional[Dict[str, Any]]:
    """
    Validate JWT token from Authorization header
    Returns the decoded payload if valid, None if invalid
    """
    if not auth_header:
        return None
    
    try:
        # Extract token from "Bearer <token>" format
        if not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        if not token:
            return None
        
        # Decode and verify the token
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
        
    except jwt.ExpiredSignatureError:
        logging.warning("JWT token expired")
        return None
    except jwt.InvalidTokenError as e:
        logging.warning(f"Invalid JWT token: {e}")
        return None
    except Exception as e:
        logging.error(f"JWT validation error: {e}")
        return None

def require_auth(req: func.HttpRequest) -> Optional[Dict[str, Any]]:
    """
    Require authentication for a request
    Returns the user payload if authenticated, raises HttpResponse if not
    """
    auth_header = req.headers.get("Authorization")
    payload = validate_jwt_token(auth_header)
    
    if not payload:
        raise func.HttpResponse(
            "Unauthorized - Invalid or missing token", 
            status_code=401
        )
    
    return payload

def get_username_from_token(req: func.HttpRequest) -> str:
    """
    Get username from JWT token in request
    Raises HttpResponse if not authenticated
    """
    payload = require_auth(req)
    return payload.get("sub")
