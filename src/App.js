import React, { useState, useEffect } from 'react';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import TodoFilters from './components/TodoFilters';
import './App.css';

const API_URL = 'https://jk7gowff2esst3zhfk4vsp5rsy0lwxay.lambda-url.us-east-1.on.aws';

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch todos from API
  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching from:', `${API_URL}/todos`);
      
      const response = await fetch(`${API_URL}/todos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Handle specific error cases
        if (response.status === 403) {
          throw new Error('Access forbidden. Please check Lambda function URL configuration.');
        } else if (response.status === 404) {
          throw new Error('API endpoint not found. Please verify the Lambda function URL.');
        } else if (response.status === 0) {
          throw new Error('Network error. This is likely a CORS or connectivity issue.');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      
      // Handle both possible response formats
      const todoList = data.todos || data || [];
      setTodos(Array.isArray(todoList) ? todoList : []);
      
    } catch (err) {
      console.error('Error fetching todos:', err);
      
      // Provide more helpful error messages
      let userMessage = err.message;
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        userMessage = 'Unable to connect to the API. This could be due to:\n' +
                     '1. CORS configuration issues\n' +
                     '2. Lambda function URL not publicly accessible\n' +
                     '3. Network connectivity problems\n' +
                     '4. Lambda function not deployed';
      }
      
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [retryCount]);

  const addTodo = async (text) => {
    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add todo: ${response.status} ${errorText}`);
      }

      const newTodo = await response.json();
      setTodos(prevTodos => [...prevTodos, newTodo]);
    } catch (err) {
      setError(err.message);
      console.error('Error adding todo:', err);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !todo.completed }),
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update todo: ${response.status} ${errorText}`);
      }

      const updatedTodo = await response.json();
      setTodos(prevTodos => 
        prevTodos.map(t => t.id === id ? updatedTodo : t)
      );
    } catch (err) {
      setError(err.message);
      console.error('Error toggling todo:', err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete todo: ${response.status} ${errorText}`);
      }

      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting todo:', err);
    }
  };

  const editTodo = async (id, newText) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText }),
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update todo: ${response.status} ${errorText}`);
      }

      const updatedTodo = await response.json();
      setTodos(prevTodos => 
        prevTodos.map(t => t.id === id ? updatedTodo : t)
      );
    } catch (err) {
      setError(err.message);
      console.error('Error editing todo:', err);
    }
  };

  const clearCompleted = async () => {
    try {
      const completedTodos = todos.filter(todo => todo.completed);
      
      // Delete all completed todos
      const results = await Promise.allSettled(
        completedTodos.map(todo => 
          fetch(`${API_URL}/todos/${todo.id}`, {
            method: 'DELETE',
            mode: 'cors'
          })
        )
      );

      // Check for any failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`${failures.length} todos failed to delete`);
      }

      setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
    } catch (err) {
      setError(err.message);
      console.error('Error clearing completed todos:', err);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  const activeCount = todos.filter(todo => !todo.completed).length;
  const completedCount = todos.filter(todo => todo.completed).length;

  if (loading) {
    return (
      <div className="App">
        <div className="todo-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <div>Loading todos...</div>
            <div style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
              Connecting to AWS Lambda...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="todo-container">
        <header>
          <h1>Todo App</h1>
          <p className="subtitle">Stay organized and productive</p>
        </header>
        
        {error && (
          <div className="error-message">
            <div className="error-content">
              <strong>Connection Error:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9em', margin: '10px 0' }}>
                {error}
              </pre>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
              <button onClick={handleRetry} className="retry-btn">Retry Connection</button>
              <button onClick={() => window.open('test-api.html', '_blank')} className="retry-btn">
                Test API Directly
              </button>
            </div>
          </div>
        )}
        
        <TodoInput onAddTodo={addTodo} />
        
        {todos.length > 0 && (
          <>
            <TodoList
              todos={filteredTodos}
              onToggleTodo={toggleTodo}
              onDeleteTodo={deleteTodo}
              onEditTodo={editTodo}
            />
            
            <TodoFilters
              filter={filter}
              onFilterChange={setFilter}
              activeCount={activeCount}
              completedCount={completedCount}
              onClearCompleted={clearCompleted}
            />
          </>
        )}
        
        {!error && todos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '1.2em', marginBottom: '10px' }}>No todos yet!</div>
            <div>Add your first todo above to get started.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;