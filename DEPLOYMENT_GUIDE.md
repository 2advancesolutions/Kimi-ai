# Lambda Function URL Configuration Guide

## Problem: 403 Forbidden Error

The 403 Forbidden error when accessing the Lambda function URL typically indicates one of these issues:

1. **Function URL Auth Type**: The function URL is configured with `AWS_IAM` authentication instead of `NONE`
2. **CORS Configuration**: Missing or incorrect CORS settings
3. **Resource Policy**: Lambda function has restrictive resource-based policies

## Solution Steps

### 1. Configure Lambda Function URL

Run these AWS CLI commands to properly configure your Lambda function:

```bash
# Update the Lambda function URL configuration for public access
aws lambda update-function-url-config \
  --function-name todo-api \
  --auth-type NONE \
  --cors-config '{"AllowCredentials":false,"AllowHeaders":["Content-Type","X-Amz-Date","Authorization","X-Api-Key","X-Amz-Security-Token"],"AllowMethods":["GET","POST","PUT","DELETE","OPTIONS"],"AllowOrigins":["*"],"ExposeHeaders":[],"MaxAge":86400}'

# Verify the configuration
aws lambda get-function-url-config --function-name todo-api
```

### 2. Check Lambda Permissions

Ensure the Lambda function has the correct resource-based policy:

```bash
# Add permission for public access (if using function URL)
aws lambda add-permission \
  --function-name todo-api \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE

# View current permissions
aws lambda get-policy --function-name todo-api
```

### 3. Alternative: Use API Gateway

If function URL continues to have issues, deploy the API Gateway configuration:

```bash
# Deploy the CloudFormation stack
aws cloudformation deploy \
  --template-file backend/api-gateway-config.yaml \
  --stack-name todo-api-gateway \
  --parameter-overrides LambdaFunctionName=todo-api \
  --capabilities CAPABILITY_IAM

# Get the API Gateway URL
aws cloudformation describe-stacks \
  --stack-name todo-api-gateway \
  --query 'Stacks[0].Outputs[?OutputKey==`TodosEndpoint`].OutputValue' \
  --output text
```

### 4. Update App.js with New URL

If using API Gateway, update the `API_URL` in `src/App.js`:

```javascript
// Replace the function URL with the API Gateway URL
const API_URL = 'https://your-api-gateway-url.amazonaws.com/prod';
```

### 5. Test the Configuration

Use the provided `test-api.html` file to test the API:

1. Open `test-api.html` in your browser
2. Click "Test GET" to verify the connection
3. Check the CORS configuration with "Test CORS OPTIONS"
4. Use browser DevTools to inspect network requests

## Debugging Checklist

- [ ] Lambda function deployed successfully
- [ ] Function URL configured with `auth-type: NONE`
- [ ] CORS configuration includes all necessary headers and methods
- [ ] Resource policy allows public access
- [ ] Function has appropriate IAM execution role
- [ ] Test with `test-api.html` before using the React app

## Common Error Messages and Solutions

**"Network Error" or "Failed to fetch"**
- Check CORS configuration
- Verify function URL is publicly accessible
- Check browser console for detailed error messages

**"403 Forbidden"**
- Update function URL auth type to NONE
- Check Lambda resource policy
- Verify function URL is properly configured

**"404 Not Found"**
- Ensure the path is `/todos` (not `/todos/`)
- Check if the Lambda function is receiving the correct event format

## Manual Testing Commands

```bash
# Test GET request
curl -X GET https://jk7gowff2esst3zhfk4vsp5rsy0lwxay.lambda-url.us-east-1.on.aws/todos

# Test POST request
curl -X POST https://jk7gowff2esst3zhfk4vsp5rsy0lwxay.lambda-url.us-east-1.on.aws/todos \
  -H "Content-Type: application/json" \
  -d '{"text": "Test todo from curl"}'

# Test CORS preflight
curl -X OPTIONS https://jk7gowff2esst3zhfk4vsp5rsy0lwxay.lambda-url.us-east-1.on.aws/todos \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```