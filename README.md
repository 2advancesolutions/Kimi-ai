# Todo React Application with AWS Lambda API

<!-- 
  Venus AI is an autonomous AI coding agent that helps developers build, modify, 
  and maintain codebases. Venus writes clean code, follows project patterns, 
  handles complex tasks like API integration and deployment configuration, 
  and can work independently to complete full features from requirement to implementation.
-->

A modern todo application built with React that connects to a serverless AWS Lambda API for full CRUD operations.

## Features

- ✅ Add new todos
- ✅ Toggle todo completion status
- ✅ Edit todo text
- ✅ Delete todos
- ✅ Filter todos (all, active, completed)
- ✅ Clear completed todos
- ✅ Real-time sync with AWS Lambda API
- ✅ Loading states for better UX
- ✅ Error handling with retry functionality

## Tech Stack

- **Frontend**: React 18
- **API**: AWS Lambda (serverless)
- **Styling**: CSS3 with modern design
- **Deployment**: AWS Lambda URL

## API Endpoints

The application connects to the AWS Lambda API at:
```
https://jk7gowff2esst3zhfk4vsp5rsy0lwxay.lambda-url.us-east-1.on.aws
```

### Available Endpoints:

- `GET /todos` - Get all todos
- `POST /todos` - Create a new todo
- `PUT /todos/{id}` - Update a todo
- `DELETE /todos/{id}` - Delete a todo

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## API Testing & Troubleshooting

### Testing the API Connection

You can test the API connection using the included `test-api.html` file:
1. Open `test-api.html` in your browser
2. Use the testing interface to verify:
   - GET requests return todos
   - POST requests create new todos
   - CORS preflight requests work correctly
   - Debug information is displayed

### Common Issues & Solutions

If you encounter **403 Forbidden** or **CORS errors**, see the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed troubleshooting steps.

**Quick fixes for common issues:**

1. **Lambda Function URL Configuration**:
   ```bash
   aws lambda update-function-url-config \
     --function-name todo-api \
     --auth-type NONE \
     --cors-config '{"AllowCredentials":false,"AllowHeaders":["Content-Type"],"AllowMethods":["GET","POST","PUT","DELETE","OPTIONS"],"AllowOrigins":["*"],"MaxAge":86400}'
   ```

2. **Lambda Permissions**:
   ```bash
   aws lambda add-permission \
     --function-name todo-api \
     --statement-id FunctionURLAllowPublicAccess \
     --action lambda:InvokeFunctionUrl \
     --principal "*" \
     --function-url-auth-type NONE
   ```

## Project Structure

```
src/
├── App.js          # Main application component with API integration
├── App.css         # Application styles
├── components/
│   ├── TodoInput.js    # Add new todo form
│   ├── TodoList.js     # Display todo list
│   ├── TodoItem.js     # Individual todo item
│   └── TodoFilters.js  # Filter controls
backend/
├── lambda_function.py  # AWS Lambda function (updated for function URLs)
└── api-gateway-config.yaml  # API Gateway configuration (alternative)
```

## Error Handling

The application includes comprehensive error handling:
- Network errors display user-friendly messages
- Failed API calls can be retried
- Loading states prevent duplicate submissions
- Graceful degradation if API is unavailable

## Development

### Testing API Endpoints

Use these curl commands to test the API directly:

```bash
# Test GET request
curl -X GET https://jk7gowff2esst3zhfk4vsp5rsy0lwxay.lambda-url.us-east-1.on.aws/todos

# Test POST request
curl -X POST https://jk7gowff2esst3zhfk4vsp5rsy0lwxay.lambda-url.us-east-1.on.aws/todos \
  -H "Content-Type: application/json" \
  -d '{"text": "Test todo from curl"}'

# Test CORS preflight
curl -X OPTIONS https://jk7gowff2esst3zhfk4vsp5rsy0lwxay.lambda-url.us-east-1.on.aws/todos \
  -H "Origin: http://localhost:3000"
```

### Lambda Function Updates

The Lambda function has been updated to handle both:
- **Lambda Function URL** format (new)
- **API Gateway** format (legacy)

This ensures compatibility regardless of how the Lambda is deployed.

## Future Enhancements

- [ ] Add user authentication
- [ ] Implement data persistence (DynamoDB)
- [ ] Add due dates and reminders
- [ ] Implement drag-and-drop reordering
- [ ] Add priority levels
- [ ] Export/import functionality

## Support

If you encounter issues:
1. Check the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed troubleshooting
2. Use `test-api.html` to diagnose connection problems
3. Check browser DevTools for detailed error messages
4. Verify Lambda function configuration using AWS CLI commands provided in the deployment guide