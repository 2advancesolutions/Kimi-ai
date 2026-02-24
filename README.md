# Todo React Application with AWS Lambda API

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

## API Testing

You can test the API connection using the included `test-api.html` file:
1. Open `test-api.html` in your browser
2. Click "Test API" to verify the Lambda function is responding

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
├── lambda_function.py  # AWS Lambda function
└── api-gateway-config.yaml  # API Gateway configuration
```

## Error Handling

The application includes comprehensive error handling:
- Network errors display user-friendly messages
- Failed API calls can be retried
- Loading states prevent duplicate submissions
- Graceful degradation if API is unavailable

## Future Enhancements

- [ ] Add user authentication
- [ ] Implement data persistence (DynamoDB)
- [ ] Add due dates and reminders
- [ ] Implement drag-and-drop reordering
- [ ] Add priority levels
- [ ] Export/import functionality