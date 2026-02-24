# API Gateway Setup Guide

This guide will help you deploy and configure API Gateway for your Todo React application with proper CORS support for `http://localhost:3001`.

## Overview

We're switching from using Lambda Function URLs to API Gateway for better CORS control, security, and scalability. The API Gateway will provide a REST API that integrates with your Lambda function.

## Prerequisites

1. AWS CLI installed and configured with appropriate permissions
2. Your Lambda function (`todo-api`) already deployed
3. Node.js and npm installed for the React app

## Step 1: Deploy API Gateway

### Option A: Using the provided deployment script (Recommended)

```bash
# Make the script executable
chmod +x deploy-api-gateway.sh

# Run the deployment script
./deploy-api-gateway.sh
```

### Option B: Manual deployment using AWS CLI

```bash
# Create the CloudFormation stack
aws cloudformation create-stack \
  --stack-name todo-api-gateway \
  --template-body file://backend/api-gateway-config.yaml \
  --parameters ParameterKey=LambdaFunctionName,ParameterValue=todo-api \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete \
  --stack-name todo-api-gateway \
  --region us-east-1

# Get the API Gateway URL
aws cloudformation describe-stacks \
  --stack-name todo-api-gateway \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`TodosEndpoint`].OutputValue' \
  --output text
```

## Step 2: Update React App Configuration

After deployment, you'll get an API Gateway URL. Update your React app to use this URL:

### Method 1: Using environment variables (Recommended)

Create a `.env` file in your project root:

```bash
# Create .env file with the API Gateway URL
REACT_APP_API_URL=https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod/todos
REACT_APP_API_TYPE=api-gateway
```

### Method 2: Update the configuration directly

Edit `src/config/api.js` and update the `development` configuration:

```javascript
const configs = {
  development: {
    baseUrl: 'https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod',
    type: 'api-gateway'
  },
  // ...
};
```

## Step 3: Test the Setup

### Test CORS Configuration

```bash
# Test CORS preflight request
curl -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod/todos

# Test GET request
curl -H "Origin: http://localhost:3001" \
     https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod/todos

# Test POST request
curl -H "Origin: http://localhost:3001" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"text":"Test todo from API Gateway"}' \
     https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod/todos
```

### Test with React App

1. Start your React development server:
   ```bash
   npm start
   ```

2. Open http://localhost:3001 in your browser

3. The app should now connect to API Gateway instead of the Lambda Function URL

## API Endpoints

After deployment, your API will have the following endpoints:

- **GET** `/todos` - Get all todos
- **POST** `/todos` - Create a new todo
- **GET** `/todos/{id}` - Get a specific todo
- **PUT** `/todos/{id}` - Update a todo
- **DELETE** `/todos/{id}` - Delete a todo
- **OPTIONS** `/todos` - CORS preflight for todos collection
- **OPTIONS** `/todos/{id}` - CORS preflight for individual todo

## CORS Configuration

The API Gateway is configured to allow CORS for `http://localhost:3001` with the following settings:

- **Allowed Origins**: `http://localhost:3001`
- **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Allowed Headers**: `Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token`

To add more origins (e.g., for production), update the `api-gateway-config.yaml` file:

```yaml
# Change from:
method.response.header.Access-Control-Allow-Origin: "'http://localhost:3001'"

# To allow multiple origins (requires Lambda integration):
# method.response.header.Access-Control-Allow-Origin: "'*'"
# Or use a Lambda authorizer for dynamic CORS
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure the API Gateway deployment completed successfully
2. **403 Forbidden**: Check Lambda function permissions for API Gateway
3. **404 Not Found**: Verify the API Gateway URL is correct
4. **Network errors**: Check your internet connection and AWS credentials

### Debug Commands

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name todo-api-gateway --region us-east-1

# Check Lambda function permissions
aws lambda get-policy --function-name todo-api --region us-east-1

# Test API Gateway directly
aws apigateway test-invoke-method \
  --rest-api-id your-api-id \
  --resource-id your-resource-id \
  --http-method GET \
  --path-with-query-string '/todos'
```

## Updating the Stack

To make changes to the API Gateway configuration:

1. Update the `api-gateway-config.yaml` file
2. Run the deployment script again:
   ```bash
   ./deploy-api-gateway.sh
   ```

## Cleanup

To remove the API Gateway stack:

```bash
aws cloudformation delete-stack --stack-name todo-api-gateway --region us-east-1
aws cloudformation wait stack-delete-complete --stack-name todo-api-gateway --region us-east-1
```

## Next Steps

1. **Custom Domain**: Set up a custom domain for your API Gateway
2. **API Key**: Add API key authentication for additional security
3. **Rate Limiting**: Configure usage plans and throttling
4. **Monitoring**: Set up CloudWatch alarms and logging
5. **CI/CD**: Integrate the deployment into your CI/CD pipeline

## Support

If you encounter issues:

1. Check the CloudFormation events: `aws cloudformation describe-stack-events --stack-name todo-api-gateway`
2. Review Lambda CloudWatch logs: `aws logs tail /aws/lambda/todo-api --follow`
3. Test the API Gateway in the AWS Console
4. Verify CORS configuration using browser developer tools