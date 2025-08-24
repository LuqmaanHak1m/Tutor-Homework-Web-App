import logging
import azure.functions as func
from azure.cosmos import CosmosClient
import os
import json
from jwt_utils import require_auth, get_username_from_token
import datetime

COSMOS_CONN_STRING = os.environ["COSMOS_CONN_STRING"]
DATABASE_NAME = os.environ["COSMOS_DB"]
CONTAINER_NAME = os.environ["COSMOS_CONTAINER"]

client = CosmosClient.from_connection_string(COSMOS_CONN_STRING)
container = client.get_database_client(DATABASE_NAME).get_container_client(CONTAINER_NAME)

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        # Require authentication for all homework operations
        user_payload = require_auth(req)
        username = user_payload.get("sub")
        
        method = req.method
        hw_id = req.route_params.get('id')

        logging.warning(f"Method={method}, ID={hw_id}, User={username}")

        if method == "GET":
            items = list(container.read_all_items())
            return func.HttpResponse(json.dumps(items), mimetype="application/json")

        elif method == "POST":
            try:
                task = req.get_json()
                # Add user information to the homework task
                task["createdBy"] = username
                task["createdAt"] = datetime.datetime.utcnow().isoformat()
                
                container.create_item(task)
                return func.HttpResponse(json.dumps(task), status_code=201, mimetype="application/json")
            except Exception as e:
                return func.HttpResponse(str(e), status_code=400)
            
        elif method == "PATCH":
            try:
                body = req.get_json()
                child_id = body.get("childId")
                if not child_id:
                    return func.HttpResponse("Missing childId in body", status_code=400)

                # Read item from Cosmos
                item = container.read_item(item=hw_id, partition_key=child_id)

                # Mark as completed
                item["completed"] = True
                item["completedBy"] = username
                item["completedAt"] = datetime.datetime.utcnow().isoformat()

                # Save update
                container.replace_item(item=hw_id, body=item)

                return func.HttpResponse(json.dumps(item), status_code=200, mimetype="application/json")

            except Exception as e:
                logging.error(f"PATCH error: {e}")
                return func.HttpResponse(str(e), status_code=500)

        return func.HttpResponse("Unsupported method", status_code=405)
        
    except func.HttpResponse as e:
        # Re-raise HTTP responses (like 401 Unauthorized)
        return e
    except Exception as e:
        logging.error(f"Homework function error: {e}")
        return func.HttpResponse(f"Internal server error: {str(e)}", status_code=500)
