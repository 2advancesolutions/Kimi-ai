#!/bin/bash

# Simple API Gateway deployment using AWS CLI
# This creates the API Gateway directly without CloudFormation

set -e

LAMBDA_FUNCTION_NAME=${1:-todo-api}
CORS_ORIGIN=${2:-http://localhost:3001}
REGION="us-east-1"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Creating API Gateway with AWS CLI...${NC}"

# Get Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function --function-name "${LAMBDA_FUNCTION_NAME}" --region "${REGION}" --query 'Configuration.FunctionArn' --output text)
echo -e "${GREEN}✅ Lambda ARN: ${LAMBDA_ARN}${NC}"

# Create REST API
API_ID=$(aws apigateway create-rest-api --name 'TodoApi' --region "${REGION}" --query 'id' --output text)
echo -e "${GREEN}✅ Created API Gateway: ${API_ID}${NC}"

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "${API_ID}" --region "${REGION}" --query 'items[0].id' --output text)

# Create /todos resource
TODOS_RESOURCE_ID=$(aws apigateway create-resource --rest-api-id "${API_ID}" --parent-id "${ROOT_RESOURCE_ID}" --path-part 'todos' --region "${REGION}" --query 'id' --output text)

# Create /todos/{id} resource
TODO_ID_RESOURCE_ID=$(aws apigateway create-resource --rest-api-id "${API_ID}" --parent-id "${TODOS_RESOURCE_ID}" --path-part '{id}' --region "${REGION}" --query 'id' --output text)

# Create GET method for /todos
aws apigateway put-method --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method GET --authorization-type NONE --region "${REGION}"

# Create POST method for /todos
aws apigateway put-method --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method POST --authorization-type NONE --region "${REGION}"

# Create PUT method for /todos/{id}
aws apigateway put-method --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method PUT --authorization-type NONE --region "${REGION}"

# Create DELETE method for /todos/{id}
aws apigateway put-method --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method DELETE --authorization-type NONE --region "${REGION}"

# Create OPTIONS method for /todos (CORS)
aws apigateway put-method --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method OPTIONS --authorization-type NONE --region "${REGION}"

# Create OPTIONS method for /todos/{id} (CORS)
aws apigateway put-method --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method OPTIONS --authorization-type NONE --region "${REGION}"

# Create Lambda integration for GET /todos
aws apigateway put-integration --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method GET --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" --region "${REGION}"

# Create Lambda integration for POST /todos
aws apigateway put-integration --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method POST --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" --region "${REGION}"

# Create Lambda integration for PUT /todos/{id}
aws apigateway put-integration --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method PUT --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" --region "${REGION}"

# Create Lambda integration for DELETE /todos/{id}
aws apigateway put-integration --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri "arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" --region "${REGION}"

# Create mock integration for OPTIONS /todos (CORS)
aws apigateway put-integration --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}' --region "${REGION}"

# Create mock integration for OPTIONS /todos/{id} (CORS)
aws apigateway put-integration --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}' --region "${REGION}"

# Add integration responses for OPTIONS methods
aws apigateway put-integration-response --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,PUT,DELETE,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''${CORS_ORIGIN}'\''"}' --response-templates '{"application/json":"{}"}' --region "${REGION}"

aws apigateway put-integration-response --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,PUT,DELETE,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''${CORS_ORIGIN}'\''"}' --response-templates '{"application/json":"{}"}' --region "${REGION}"

# Add method responses for OPTIONS methods
aws apigateway put-method-response --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' --region "${REGION}"

aws apigateway put-method-response --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' --region "${REGION}"

# Add method responses for actual methods
aws apigateway put-method-response --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method GET --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true}' --region "${REGION}"

aws apigateway put-method-response --rest-api-id "${API_ID}" --resource-id "${TODOS_RESOURCE_ID}" --http-method POST --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true}' --region "${REGION}"

aws apigateway put-method-response --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method PUT --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true}' --region "${REGION}"

aws apigateway put-method-response --rest-api-id "${API_ID}" --resource-id "${TODO_ID_RESOURCE_ID}" --http-method DELETE --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true}' --region "${REGION}"

# Create deployment
aws apigateway create-deployment --rest-api-id "${API_ID}" --stage-name prod --region "${REGION}"

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission --function-name "${LAMBDA_FUNCTION_NAME}" --statement-id "apigateway-todo-${API_ID}" --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:${REGION}:${AWS::AccountId}:${API_ID}/*/*" --region "${REGION}"

# Get the final URL
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/todos"

echo -e "${GREEN}🎉 API Gateway created successfully!${NC}"
echo -e "${GREEN}📋 API URL: ${API_URL}${NC}"

# Create .env file
cat > .env << EOF
REACT_APP_API_URL=${API_URL}
REACT_APP_API_TYPE=api-gateway
REACT_APP_CORS_ORIGIN=${CORS_ORIGIN}
EOF

echo -e "${GREEN}✅ .env file created${NC}"
echo -e "${GREEN}🚀 You can now start your React app with: npm start${NC}"