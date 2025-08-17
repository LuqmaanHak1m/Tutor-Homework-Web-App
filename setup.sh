#!/bin/bash
# Exit on error
set -e

# === CONFIG ===
RG="hw_tracker"
LOC="uksouth"

# Random suffix to make names unique
SUFFIX=$RANDOM

# Cosmos DB (account must be all lowercase, no dashes)
COSMOS="hwtrackercosmos${SUFFIX}"

# Storage account for Function App
FXNSTORE="hwtrackerfxnstore${SUFFIX}"

# Function App name (dashes are allowed here)
FUNCAPP="hwtracker-func-${SUFFIX}"

# Storage account for static web hosting
WEBSTORE="hwtrackerweb${SUFFIX}"

echo "=== Creating Cosmos DB (serverless) ==="
az cosmosdb create \
  -g $RG \
  -n $COSMOS \
  --capabilities EnableServerless \
  --locations regionName=$LOC failoverPriority=0 isZoneRedundant=False

echo "=== Creating Cosmos DB Database and Container ==="
az cosmosdb sql database create \
  -g $RG -a $COSMOS -n appdb

az cosmosdb sql container create \
  -g $RG -a $COSMOS -d appdb -n homework \
  --partition-key-path "/childId"

COSMOS_CONN=$(az cosmosdb keys list \
  -g $RG -a $COSMOS \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv)

echo "=== Creating Storage for Function App ==="
az storage account create \
  -n $FXNSTORE \
  -g $RG -l $LOC --sku Standard_LRS

echo "=== Creating Function App (Python, Consumption plan) ==="
az functionapp create \
  --resource-group $RG \
  --consumption-plan-location $LOC \
  --runtime python --runtime-version 3.10 \
  --functions-version 4 \
  --name $FUNCAPP \
  --storage-account $FXNSTORE

echo "=== Configuring Function App settings (Cosmos connection) ==="
az functionapp config appsettings set \
  -g $RG -n $FUNCAPP \
  --settings \
  COSMOS_CONN_STRING="$COSMOS_CONN" \
  COSMOS_DB="appdb" \
  COSMOS_CONTAINER="homework"

echo "=== Creating Storage for Static Website ==="
az storage account create \
  -n $WEBSTORE \
  -g $RG -l $LOC --sku Standard_LRS --kind StorageV2

az storage blob service-properties update \
  --account-name $WEBSTORE \
  --static-website \
  --index-document index.html \
  --error-document 404.html

WEB_ENDPOINT=$(az storage account show \
  -n $WEBSTORE -g $RG \
  --query "primaryEndpoints.web" -o tsv)

echo "=== Adding CORS to Function App for local + static site ==="
az functionapp cors add \
  -g $RG -n $FUNCAPP \
  --allowed-origins "http://localhost:5500" "$WEB_ENDPOINT"

echo "=== DONE! ==="
echo "Cosmos DB Account: $COSMOS"
echo "Function App Name: $FUNCAPP"
echo "Static Website Storage: $WEBSTORE"
echo "Static Website URL: $WEB_ENDPOINT"
echo
echo "👉 Next steps:"
echo "1. Deploy your Function App code with: func azure functionapp publish $FUNCAPP"
echo "2. Upload your frontend files to static hosting with:"
echo "   az storage blob upload-batch -d '$web' -s ./web --account-name $WEBSTORE"
