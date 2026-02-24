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
        # Enhanced logging for debugging
        print(f"Received event: {json.dumps(event)}")
        
        # Handle preflight OPTIONS request
        if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS' or \
           event.get('httpMethod') == 'OPTIONS' or \
           event.get('routeKey') == 'OPTIONS /todos' or \
           event.get('routeKey') == 'OPTIONS /todos/{id}':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # Parse the request for both Lambda Function URL and API Gateway formats
        if 'requestContext' in event and 'http' in event.get('requestContext', {}):
            # Lambda Function URL format (v2.0)
            http_method = event['requestContext']['http']['method']
            path = event['requestContext']['http']['path']
            body = event.get('body', '{}') if event.get('body') else '{}'
            print(f"Function URL format - Method: {http_method}, Path: {path}")
        elif 'requestContext' in event and 'httpMethod' in event.get('requestContext', {}):
            # API Gateway format (v1.0)
            http_method = event['requestContext']['httpMethod']
            path = event['requestContext']['path']
            body = event.get('body', '{}') if event.get('body') else '{}'
            print(f"API Gateway v1 format - Method: {http_method}, Path: {path}")
        else:
            # Direct invocation or other format
            http_method = event.get('httpMethod', 'GET')
            path = event.get('path', '/')
            body = event.get('body', '{}')
            print(f"Direct format - Method: {http_method}, Path: {path}")
        
        # Parse JSON body if present
        try:
            body_data = json.loads(body) if body and body != '{}' else {}
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            body_data = {}
        
        print(f"Body data: {body_data}")
        
        # Route to appropriate handler with enhanced path matching
        if http_method == 'GET' and (path == '/todos' or path == '/todos/'):
            return get_all_todos(headers)
        elif http_method == 'GET' and path.startswith('/todos/'):
            todo_id = path.split('/')[-1]
            if todo_id:  # Make sure we have a valid ID
                return get_todo_by_id(todo_id, headers)
        elif http_method == 'POST' and (path == '/todos' or path == '/todos/'):
            return create_todo(body_data, headers)
        elif http_method == 'PUT' and path.startswith('/todos/'):
            todo_id = path.split('/')[-1]
            if todo_id:
                return update_todo(todo_id, body_data, headers)
        elif http_method == 'DELETE' and path.startswith('/todos/'):
            todo_id = path.split('/')[-1]
            if todo_id:
                return delete_todo(todo_id, headers)
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Endpoint not found',
                    'path': path,
                    'method': http_method,
                    'available_endpoints': [
                        'GET /todos',
                        'GET /todos/{id}',
                        'POST /todos',
                        'PUT /todos/{id}',
                        'DELETE /todos/{id}'
                    ]
                })
            }
            
    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'type': type(e).__name__
            })
        }

def get_all_todos(headers):
    """Get all todos"""
    try:
        todo_list = list(todos.values())
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'todos': todo_list,
                'count': len(todo_list),
                'status': 'success'
            })
        }
    except Exception as e:
        print(f"Error in get_all_todos: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to retrieve todos: {str(e)}'})
        }

def get_todo_by_id(todo_id, headers):
    """Get a specific todo by ID"""
    try:
        if todo_id in todos:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    **todos[todo_id],
                    'status': 'success'
                })
            }
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Todo not found',
                    'id': todo_id,
                    'status': 'error'
                })
            }
    except Exception as e:
        print(f"Error in get_todo_by_id: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to retrieve todo: {str(e)}'})
        }

def create_todo(data, headers):
    """Create a new todo"""
    try:
        if 'text' not in data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Text is required',
                    'received_data': data,
                    'status': 'error'
                })
            }
        
        todo_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        todo = {
            'id': todo_id,
            'text': data['text'],
            'completed': False,
            'createdAt': now,
            'updatedAt': now
        }
        
        todos[todo_id] = todo
        
        print(f"Created todo: {todo}")
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                **todo,
                'status': 'success'
            })
        }
    except Exception as e:
        print(f"Error in create_todo: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to create todo: {str(e)}'})
        }

def update_todo(todo_id, data, headers):
    """Update an existing todo"""
    try:
        if todo_id not in todos:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Todo not found',
                    'id': todo_id,
                    'status': 'error'
                })
            }
        
        todo = todos[todo_id]
        
        # Update fields if provided
        if 'text' in data:
            todo['text'] = data['text']
        if 'completed' in data:
            todo['completed'] = data['completed']
        
        todo['updatedAt'] = datetime.now().isoformat()
        
        print(f"Updated todo: {todo}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                **todo,
                'status': 'success'
            })
        }
    except Exception as e:
        print(f"Error in update_todo: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to update todo: {str(e)}'})
        }

def delete_todo(todo_id, headers):
    """Delete a todo"""
    try:
        if todo_id not in todos:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Todo not found',
                    'id': todo_id,
                    'status': 'error'
                })
            }
        
        del todos[todo_id]
        
        print(f"Deleted todo with id: {todo_id}")
        
        return {
            'statusCode': 204,
            'headers': headers,
            'body': ''
        }
    except Exception as e:
        print(f"Error in delete_todo: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to delete todo: {str(e)}'})
        }