import React, { useState } from 'react';
import './TodoItem.css';

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onToggle(todo.id);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onDelete(todo.id);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (editText.trim() && editText !== todo.text) {
      setLoading(true);
      try {
        await onEdit(todo.id, editText.trim());
        setIsEditing(false);
      } finally {
        setLoading(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''} ${loading ? 'loading' : ''}`}>
      <div className="todo-content">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggle}
          className="todo-checkbox"
          disabled={loading}
        />
        
        {isEditing ? (
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleEdit}
            className="todo-edit-input"
            autoFocus
            disabled={loading}
          />
        ) : (
          <span 
            className="todo-text"
            onDoubleClick={() => setIsEditing(true)}
          >
            {todo.text}
          </span>
        )}
      </div>
      
      <div className="todo-actions">
        {!isEditing && (
          <button
            className="todo-edit-btn"
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            Edit
          </button>
        )}
        <button
          className="todo-delete-btn"
          onClick={handleDelete}
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

export default TodoItem;