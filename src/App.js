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
        mode: 'cors'
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch todos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      setTodos(data.todos || []);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

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
        throw new Error(`Failed to add todo: ${response.status} ${response.statusText} - ${errorText}`);
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
        throw new Error(`Failed to update todo: ${response.status} ${response.statusText} - ${errorText}`);
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
        throw new Error(`Failed to delete todo: ${response.status} ${response.statusText} - ${errorText}`);
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
        throw new Error(`Failed to update todo: ${response.status} ${response.statusText} - ${errorText}`);
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
      await Promise.all(
        completedTodos.map(todo => 
          fetch(`${API_URL}/todos/${todo.id}`, {
            method: 'DELETE',
            mode: 'cors'
          })
        )
      );

      setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
    } catch (err) {
      setError(err.message);
      console.error('Error clearing completed todos:', err);
    }
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
            Loading todos...
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
              <strong>Connection Error:</strong> {error}
              <br />
              <small>Make sure the Lambda function URL is properly configured with CORS and public access.</small>
            </div>
            <button onClick={fetchTodos} className="retry-btn">Retry Connection</button>
          </div>
        )}
        
        <TodoInput onAddTodo={addTodo} />
        
        <TodoList
          todos={filteredTodos}
          onToggleTodo={toggleTodo}
          onDeleteTodo={deleteTodo}
          onEditTodo={editTodo}
        />
        
        {todos.length > 0 && (
          <TodoFilters
            filter={filter}
            onFilterChange={setFilter}
            activeCount={activeCount}
            completedCount={completedCount}
            onClearCompleted={clearCompleted}
          />
        )}
      </div>
    </div>
  );
}

export default App;