import json
import uuid
from datetime import datetime

# In-memory storage for todos (will persist during Lambda container reuse)
todos = {}

def lambda_handler(event, context):
    """
    Main Lambda handler for todo API
    """
    
    # Add CORS headers for frontend integration
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
    }
    
    try:
        # Handle preflight OPTIONS request
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # Parse the request path and method
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        # Route to appropriate handler
        if http_method == 'GET' and path == '/todos':
            return get_all_todos(headers)
        elif http_method == 'GET' and path.startswith('/todos/'):
            todo_id = path.split('/')[-1]
            return get_todo_by_id(todo_id, headers)
        elif http_method == 'POST' and path == '/todos':
            body = json.loads(event.get('body', '{}'))
            return create_todo(body, headers)
        elif http_method == 'PUT' and path.startswith('/todos/'):
            todo_id = path.split('/')[-1]
            body = json.loads(event.get('body', '{}'))
            return update_todo(todo_id, body, headers)
        elif http_method == 'DELETE' and path.startswith('/todos/'):
            todo_id = path.split('/')[-1]
            return delete_todo(todo_id, headers)
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Endpoint not found'})
            }
            
    except Exception as e:
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