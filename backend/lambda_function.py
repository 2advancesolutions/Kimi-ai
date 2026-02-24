import json
import uuid
from datetime import datetime

# In-memory storage for todos (will persist during Lambda container reuse)
todos = {}

def lambda_handler(event, context):
    """
    Main Lambda handler for todo API
    Supports both Lambda Function URL and API Gateway formats
    """
    
    # Add CORS headers for frontend integration
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
    }
    
    try:
        # Handle preflight OPTIONS request
        if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS' or \
           event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # Parse the request for both Lambda Function URL and API Gateway formats
        if 'requestContext' in event and 'http' in event.get('requestContext', {}):
            # Lambda Function URL format
            http_method = event['requestContext']['http']['method']
            path = event['requestContext']['http']['path']
            body = event.get('body', '{}') if event.get('body') else '{}'
        else:
            # API Gateway format (backward compatibility)
            http_method = event.get('httpMethod', 'GET')
            path = event.get('path', '/')
            body = event.get('body', '{}')
        
        # Parse JSON body if present
        try:
            body_data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            body_data = {}
        
        print(f"Method: {http_method}, Path: {path}, Body: {body_data}")
        
        # Route to appropriate handler
        if http_method == 'GET' and path == '/todos':
            return get_all_todos(headers)
        elif http_method == 'GET' and path.startswith('/todos/'):
            todo_id = path.split('/')[-1]
            return get_todo_by_id(todo_id, headers)
        elif http_method == 'POST' and path == '/todos':
            return create_todo(body_data, headers)
        elif http_method == 'PUT' and path.startswith('/todos/'):
            todo_id = path.split('/')[-1]
            return update_todo(todo_id, body_data, headers)
        elif http_method == 'DELETE' and path.startswith('/todos/'):
            todo_id = path.split('/')[-1]
            return delete_todo(todo_id, headers)
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Endpoint not found', 'path': path, 'method': http_method})
            }
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def get_all_todos(headers):
    """Get all todos"""
    todo_list = list(todos.values())
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'todos': todo_list,
            'count': len(todo_list)
        })
    }

def get_todo_by_id(todo_id, headers):
    """Get a specific todo by ID"""
    if todo_id in todos:
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(todos[todo_id])
        }
    else:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Todo not found'})
        }

def create_todo(data, headers):
    """Create a new todo"""
    if 'text' not in data:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Text is required'})
        }
    
    todo_id = str(uuid.uuid4())
    todo = {
        'id': todo_id,
        'text': data['text'],
        'completed': False,
        'createdAt': datetime.now().isoformat(),
        'updatedAt': datetime.now().isoformat()
    }
    
    todos[todo_id] = todo
    
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps(todo)
    }

def update_todo(todo_id, data, headers):
    """Update an existing todo"""
    if todo_id not in todos:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Todo not found'})
        }
    
    todo = todos[todo_id]
    
    # Update fields if provided
    if 'text' in data:
        todo['text'] = data['text']
    if 'completed' in data:
        todo['completed'] = data['completed']
    
    todo['updatedAt'] = datetime.now().isoformat()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(todo)
    }

def delete_todo(todo_id, headers):
    """Delete a todo"""
    if todo_id not in todos:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Todo not found'})
        }
    
    del todos[todo_id]
    
    return {
        'statusCode': 204,
        'headers': headers,
        'body': ''
    }