import React, { useState } from 'react';
import './TodoInput.css';

function TodoInput({ onAddTodo }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim() && !loading) {
      setLoading(true);
      try {
        await onAddTodo(text.trim());
        setText('');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-input">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        className="todo-input-field"
        disabled={loading}
      />
      <button type="submit" className="todo-add-button" disabled={!text.trim() || loading}>
        {loading ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
}

export default TodoInput;