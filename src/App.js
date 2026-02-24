import React, { useState, useEffect } from 'react';
import TodoInput from './components/TodoInput';
import TodoList from './components/TodoList';
import TodoFilters from './components/TodoFilters';
import { API_CONFIG, buildApiUrl, handleApiError, getRequestConfig } from './config/api';
import './App.css';

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
      
      const apiUrl = buildApiUrl(API_CONFIG.ENDPOINTS.TODOS);
      console.log('Fetching from:', apiUrl);
      console.log('API Type:', API_CONFIG.TYPE);
      
      const response = await fetch(apiUrl, getRequestConfig('GET'));
      await handleApiError(response);
      
      const data = await response.json();
      console.log('Fetched data:', data);
      
      // Handle both possible response formats
      const todoList = data.todos || data || [];
      setTodos(Array.isArray(todoList) ? todoList : []);
      
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [retryCount]);

  const addTodo = async (text) => {
    try {
      setError(null);
      
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.TODOS),
        getRequestConfig('POST', { text })
      );
      
      await handleApiError(response);
      const newTodo = await response.json();
      setTodos(prevTodos => [...prevTodos, newTodo]);
    } catch (err) {
      console.error('Error adding todo:', err);
      setError(err.message);
    }
  };

  const toggleTodo = async (id) => {
    try {
      setError(null);
      
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.TODO(id)),
        getRequestConfig('PUT', { completed: !todo.completed })
      );
      
      await handleApiError(response);
      const updatedTodo = await response.json();
      
      setTodos(prevTodos => 
        prevTodos.map(t => t.id === id ? updatedTodo : t)
      );
    } catch (err) {
      console.error('Error toggling todo:', err);
      setError(err.message);
    }
  };

  const deleteTodo = async (id) => {
    try {
      setError(null);
      
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.TODO(id)),
        getRequestConfig('DELETE')
      );
      
      await handleApiError(response);
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError(err.message);
    }
  };

  const editTodo = async (id, newText) => {
    try {
      setError(null);
      
      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.TODO(id)),
        getRequestConfig('PUT', { text: newText })
      );
      
      await handleApiError(response);
      const updatedTodo = await response.json();
      
      setTodos(prevTodos => 
        prevTodos.map(t => t.id === id ? updatedTodo : t)
      );
    } catch (err) {
      console.error('Error editing todo:', err);
      setError(err.message);
    }
  };

  const clearCompleted = async () => {
    try {
      setError(null);
      const completedTodos = todos.filter(todo => todo.completed);
      
      // Delete all completed todos
      const results = await Promise.allSettled(
        completedTodos.map(todo => 
          fetch(
            buildApiUrl(API_CONFIG.ENDPOINTS.TODO(todo.id)),
            getRequestConfig('DELETE')
          ).then(handleApiError)
        )
      );

      // Check for any failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`${failures.length} todos failed to delete`);
      }

      setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
    } catch (err) {
      console.error('Error clearing completed todos:', err);
      setError(err.message);
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
              Connecting to {API_CONFIG.TYPE === 'api-gateway' ? 'API Gateway' : 'Lambda Function'}...
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
          <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
            API: {API_CONFIG.TYPE} ({API_CONFIG.BASE_URL})
          </div>
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