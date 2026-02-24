#!/bin/bash

# Deploy API Gateway for Todo Lambda function
# Usage: ./deploy-api-gateway.sh [lambda-function-name] [cors-origin]

set -e

# Configuration
LAMBDA_FUNCTION_NAME=${1:-todo-api}
CORS_ORIGIN=${2:-http://localhost:3001}
STACK_NAME="todo-api-gateway"
REGION="us-east-1"
TEMPLATE_FILE="backend/api-gateway-simple.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting API Gateway deployment for Todo API...${NC}"
echo -e "${BLUE}Lambda Function: ${LAMBDA_FUNCTION_NAME}${NC}"
echo -e "${BLUE}CORS Origin: ${CORS_ORIGIN}${NC}"
echo -e "${BLUE}Stack Name: ${STACK_NAME}${NC}"
echo -e "${BLUE}Region: ${REGION}${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

# Check if Lambda function exists
echo -e "${BLUE}🔍 Checking if Lambda function '${LAMBDA_FUNCTION_NAME}' exists...${NC}"
if aws lambda get-function --function-name "${LAMBDA_FUNCTION_NAME}" --region "${REGION}" &> /dev/null; then
    echo -e "${GREEN}✅ Lambda function '${LAMBDA_FUNCTION_NAME}' found${NC}"
else
    echo -e "${RED}❌ Lambda function '${LAMBDA_FUNCTION_NAME}' not found${NC}"
    echo -e "${YELLOW}💡 Make sure your Lambda function is deployed first${NC}"
    exit 1
fi

# Check if CloudFormation template exists
if [[ ! -f "${TEMPLATE_FILE}" ]]; then
    echo -e "${RED}❌ CloudFormation template not found: ${TEMPLATE_FILE}${NC}"
    exit 1
fi

# Package the template for deployment
echo -e "${BLUE}📦 Preparing CloudFormation template...${NC}"

# Check if stack exists
echo -e "${BLUE}🔍 Checking if CloudFormation stack '${STACK_NAME}' exists...${NC}"
if aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" &> /dev/null; then
    echo -e "${YELLOW}🔄 Stack exists. Updating...${NC}"
    
    # Update stack
    aws cloudformation update-stack \
        --stack-name "${STACK_NAME}" \
        --template-body "file://${TEMPLATE_FILE}" \
        --parameters ParameterKey=LambdaFunctionName,ParameterValue="${LAMBDA_FUNCTION_NAME}" \
                     ParameterKey=CorsOrigin,ParameterValue="${CORS_ORIGIN}" \
        --capabilities CAPABILITY_IAM \
        --region "${REGION}" || {
            echo -e "${YELLOW}⚠️  No updates to be performed${NC}"
        }
    
    echo -e "${BLUE}⏳ Waiting for stack update to complete...${NC}"
    aws cloudformation wait stack-update-complete \
        --stack-name "${STACK_NAME}" \
        --region "${REGION}" || {
            echo -e "${YELLOW}⚠️  Stack update completed or no changes needed${NC}"
        }
    
    echo -e "${GREEN}✅ Stack updated successfully${NC}"
else
    echo -e "${YELLOW}🆕 Stack does not exist. Creating...${NC}"
    
    # Create stack
    aws cloudformation create-stack \
        --stack-name "${STACK_NAME}" \
        --template-body "file://${TEMPLATE_FILE}" \
        --parameters ParameterKey=LambdaFunctionName,ParameterValue="${LAMBDA_FUNCTION_NAME}" \
                     ParameterKey=CorsOrigin,ParameterValue="${CORS_ORIGIN}" \
        --capabilities CAPABILITY_IAM \
        --region "${REGION}"
    
    echo -e "${BLUE}⏳ Waiting for stack creation to complete...${NC}"
    aws cloudformation wait stack-create-complete \
        --stack-name "${STACK_NAME}" \
        --region "${REGION}"
    
    echo -e "${GREEN}✅ Stack created successfully${NC}"
fi

# Get the API Gateway URL
echo -e "${BLUE}🔗 Retrieving API Gateway URL...${NC}"
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

if [[ -n "${API_URL}" ]]; then
    echo -e "${GREEN}✅ API Gateway URL: ${API_URL}${NC}"
    
    # Create/update .env file
    echo -e "${BLUE}📝 Updating .env file...${NC}"
    cat > .env << EOF
# API Configuration
REACT_APP_API_URL=${API_URL}
REACT_APP_API_TYPE=api-gateway
REACT_APP_CORS_ORIGIN=${CORS_ORIGIN}

# Development settings
REACT_APP_DEV_MODE=true
EOF
    
    echo -e "${GREEN}✅ .env file created with API Gateway URL${NC}"
    
    # Test the API Gateway
    echo -e "${BLUE}🧪 Testing API Gateway endpoints...${NC}"
    sleep 10  # Wait for API Gateway to be fully available
    
    if [[ -f "test-api-gateway.js" ]]; then
        REACT_APP_API_URL="${API_URL}" node test-api-gateway.js
    else
        echo -e "${YELLOW}⚠️  Test script not found. Skipping tests.${NC}"
    fi
    
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo -e "${GREEN}📋 API Gateway URL: ${API_URL}${NC}"
    echo -e "${GREEN}🌐 Your React app can now connect to the API Gateway${NC}"
    echo -e "${GREEN}🚀 Start your React app with: npm start${NC}"
    
else
    echo -e "${RED}❌ Failed to retrieve API Gateway URL${NC}"
    echo -e "${YELLOW}💡 Check CloudFormation events for details:${NC}"
    aws cloudformation describe-stack-events \
        --stack-name "${STACK_NAME}" \
        --region "${REGION}" \
        --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`||ResourceStatus==`UPDATE_FAILED`].[LogicalResourceId,ResourceStatusReason]' \
        --output table
    exit 1
fi

# Display useful commands
echo -e "${BLUE}📋 Useful commands:${NC}"
echo -e "  View stack: aws cloudformation describe-stacks --stack-name ${STACK_NAME} --region ${REGION}"
echo -e "  View logs: aws logs tail /aws/lambda/${LAMBDA_FUNCTION_NAME} --follow"
echo -e "  Test API: curl -H 'Origin: ${CORS_ORIGIN}' ${API_URL}"
echo -e "  Delete stack: aws cloudformation delete-stack --stack-name ${STACK_NAME} --region ${REGION}"