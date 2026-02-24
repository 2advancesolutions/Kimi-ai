#!/bin/bash

# AWS API Gateway Deployment Script for Todo API
# This script deploys the API Gateway configuration using AWS CLI

echo "🚀 Starting API Gateway deployment for Todo API..."

# Configuration
STACK_NAME="todo-api-gateway"
TEMPLATE_FILE="backend/api-gateway-config.yaml"
REGION="us-east-1"
LAMBDA_FUNCTION_NAME="todo-api"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run: aws configure"
    exit 1
fi

# Check if the Lambda function exists
echo "🔍 Checking if Lambda function '$LAMBDA_FUNCTION_NAME' exists..."
if aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --region $REGION &> /dev/null; then
    echo "✅ Lambda function '$LAMBDA_FUNCTION_NAME' found"
else
    echo "❌ Lambda function '$LAMBDA_FUNCTION_NAME' not found. Please deploy the Lambda function first."
    exit 1
fi

# Package the CloudFormation template (if needed)
echo "📦 Preparing CloudFormation stack..."

# Check if stack exists
echo "🔍 Checking if CloudFormation stack '$STACK_NAME' exists..."
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    echo "🔄 Stack exists. Updating..."
    
    # Update the stack
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=LambdaFunctionName,ParameterValue=$LAMBDA_FUNCTION_NAME \
        --capabilities CAPABILITY_IAM \
        --region $REGION
    
    echo "⏳ Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete \
        --stack-name $STACK_NAME \
        --region $REGION
    
    echo "✅ Stack updated successfully"
else
    echo "🆕 Stack does not exist. Creating..."
    
    # Create the stack
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters ParameterKey=LambdaFunctionName,ParameterValue=$LAMBDA_FUNCTION_NAME \
        --capabilities CAPABILITY_IAM \
        --region $REGION
    
    echo "⏳ Waiting for stack creation to complete..."
    aws cloudformation wait stack-create-complete \
        --stack-name $STACK_NAME \
        --region $REGION
    
    echo "✅ Stack created successfully"
fi

# Get the API Gateway URL
echo "🔗 Retrieving API Gateway URL..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`TodosEndpoint`].OutputValue' \
    --output text)

if [ -z "$API_URL" ]; then
    echo "❌ Failed to retrieve API Gateway URL"
    exit 1
fi

echo "✅ API Gateway deployed successfully!"
echo "📍 API Gateway URL: $API_URL"

# Create/update .env file with the new API URL
echo "📝 Creating .env file with API Gateway URL..."
cat > .env << EOF
# API Configuration
REACT_APP_API_URL=$API_URL
REACT_APP_API_TYPE=api-gateway

# Development settings
REACT_APP_DEV_MODE=true
EOF

echo "✅ .env file created with API Gateway configuration"
echo ""
echo "🎯 Next steps:"
echo "1. Update your React app to use the new API Gateway URL"
echo "2. Test the API endpoints:"
echo "   GET    $API_URL"
echo "   POST   $API_URL"
echo "   PUT    $API_URL/{id}"
echo "   DELETE $API_URL/{id}"
echo ""
echo "🧪 Test CORS with:"
echo "   curl -H \"Origin: http://localhost:3001\" -H \"Access-Control-Request-Method: GET\" \"
        -X OPTIONS $API_URL\""