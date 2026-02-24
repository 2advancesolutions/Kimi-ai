import React from 'react';
import './TodoFilters.css';

function TodoFilters({ filter, onFilterChange, activeCount, completedCount, onClearCompleted }) {
  const filters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' }
  ];

  return (
    <div className="todo-filters">
      <div className="todo-count">
        {activeCount} {activeCount === 1 ? 'item' : 'items'} left
      </div>
      
      <div className="filter-buttons">
        {filters.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={`filter-button ${filter === value ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      
      {completedCount > 0 && (
        <button
          onClick={onClearCompleted}
          className="clear-completed"
        >
          Clear completed
        </button>
      )}
    </div>
  );
}

export default TodoFilters;