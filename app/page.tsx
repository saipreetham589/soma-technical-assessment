"use client"
import { Todo } from '@prisma/client';
import { useState, useEffect } from 'react';

// Extended Todo type to include dueDate and imageUrl
interface TodoWithDueDate extends Todo {
  dueDate?: string | null;
  imageUrl?: string | null;
}

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [todos, setTodos] = useState<TodoWithDueDate[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    
    setIsCreating(true);
    
    try {
      const payload: { title: string; dueDate?: string } = { title: newTodo };
      
      // Only include dueDate if it's provided
      if (newDueDate) {
        payload.dueDate = newDueDate;
      }

      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      setNewTodo('');
      setNewDueDate('');
      fetchTodos();
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTodo = async (id: any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const isOverdue = (dueDate: string | null | undefined): boolean => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatDueDate = (dueDate: string | null | undefined): string => {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  // Image component with loading state
  const TodoImage = ({ imageUrl, title }: { imageUrl?: string | null; title: string }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    if (!imageUrl) {
      return (
        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-xs">📝</span>
        </div>
      );
    }

    return (
      <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-200">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
          </div>
        )}
        {hasError ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            📝
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={`Visual for ${title}`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        
        {/* Todo Input Form */}
        <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-xl">
          <input
            type="text"
            className="w-full p-3 rounded-xl focus:outline-none text-gray-700 mb-3 shadow-md"
            placeholder="Add a new todo"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          
          <div className="flex gap-3 mb-4">
            <input 
              type="date" 
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="flex-1 p-3 rounded-xl focus:outline-none text-gray-700 shadow-md"
            />
            <button
              onClick={handleAddTodo}
              disabled={isCreating}
              className="bg-white text-orange-600 px-6 py-3 rounded-xl hover:bg-gray-100 transition duration-300 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-600 border-t-transparent"></div>
                  Adding...
                </>
              ) : (
                'Add'
              )}
            </button>
          </div>
          
          {newDueDate && (
            <p className="text-white text-sm opacity-90">
              Due: {formatDueDate(newDueDate)}
            </p>
          )}
          
          {isCreating && (
            <p className="text-white text-sm opacity-90 text-center mt-2">
              Creating todo and finding the perfect image... 🖼️
            </p>
          )}
        </div>

        {/* Todo List */}
        <ul className="space-y-3">
          {todos.map((todo: TodoWithDueDate) => (
            <li
              key={todo.id}
              className="flex items-center gap-4 bg-white bg-opacity-90 p-4 rounded-xl shadow-lg hover:bg-opacity-100 transition duration-300"
            >
              {/* Todo Image */}
              <TodoImage imageUrl={todo.imageUrl} title={todo.title} />
              
              {/* Todo Content */}
              <div className="flex-1">
                <span className="text-gray-800 font-medium">{todo.title}</span>
                {todo.dueDate && (
                  <div className={`text-sm mt-1 font-semibold ${
                    isOverdue(todo.dueDate) 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    Due: {formatDueDate(todo.dueDate)}
                    {isOverdue(todo.dueDate) && (
                      <span className="ml-2 text-red-600 font-bold">⚠️ OVERDUE</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Delete Button */}
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700 transition duration-300 p-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        {todos.length === 0 && (
          <div className="text-center text-white opacity-75 mt-8">
            <p className="text-lg">No todos yet!</p>
            <p className="text-sm">Add your first task above 📝</p>
          </div>
        )}
      </div>
    </div>
  );
}