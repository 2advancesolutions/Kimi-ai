import React, { useState } from 'react';
import './TodoInput.css';

function TodoInput({ onAddTodo }) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAddTodo(inputValue);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-input">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="What needs to be done?"
        className="todo-input-field"
      />
      <button type="submit" className="add-button">
        Add
      </button>
    </form>
  );
}

export default TodoInput;