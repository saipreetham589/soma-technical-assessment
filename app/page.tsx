"use client"
import { Todo, TaskDependency } from '@prisma/client';
import { useState, useEffect } from 'react';

// Extended Todo type with dependencies
interface TodoWithDependencies extends Todo {
  dueDate?: string | null;
  imageUrl?: string | null;
  dependencies: Array<{
    id: number;
    dependentId: number;
    dependencyId: number;
    dependency: Todo;
  }>;
  dependents: Array<{
    id: number;
    dependentId: number;
    dependencyId: number;
    dependent: Todo;
  }>;
}

interface DependencyGraph {
  todos: TodoWithDependencies[];
  dependencies: TaskDependency[];
  criticalPath: number[];
}

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDuration, setNewDuration] = useState('1');
  const [todos, setTodos] = useState<TodoWithDependencies[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<number | null>(null);
  const [selectedDependency, setSelectedDependency] = useState<number | null>(null);

  useEffect(() => {
    fetchTodos();
    fetchGraph();
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

  const fetchGraph = async () => {
    try {
      const res = await fetch('/api/todos/graph');
      const data = await res.json();
      setGraph(data);
    } catch (error) {
      console.error('Failed to fetch graph:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    
    setIsCreating(true);
    
    try {
      const payload: { title: string; dueDate?: string; duration?: number } = { 
        title: newTodo,
        duration: parseInt(newDuration) || 1
      };
      
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
      setNewDuration('1');
      fetchTodos();
      fetchGraph();
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
      fetchGraph();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedTodo || !selectedDependency) return;
    
    try {
      const res = await fetch(`/api/todos/${selectedTodo}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependencyId: selectedDependency }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to add dependency');
        return;
      }
      
      setSelectedTodo(null);
      setSelectedDependency(null);
      fetchTodos();
      fetchGraph();
    } catch (error) {
      console.error('Failed to add dependency:', error);
      alert('Failed to add dependency');
    }
  };

  const handleRemoveDependency = async (dependentId: number, dependencyId: number) => {
    try {
      await fetch(`/api/todos/${dependentId}/dependencies/${dependencyId}`, {
        method: 'DELETE',
      });
      fetchTodos();
      fetchGraph();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  const isOverdue = (dueDate: string | null | undefined): boolean => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
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
      <div className="w-full max-w-4xl">
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
            <input 
              type="number" 
              min="1"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="w-24 p-3 rounded-xl focus:outline-none text-gray-700 shadow-md"
              placeholder="Days"
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
          
          <div className="text-white text-sm opacity-90 flex justify-between">
            {newDueDate && <span>Due: {formatDate(newDueDate)}</span>}
            <span>Duration: {newDuration} day{newDuration !== '1' ? 's' : ''}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="bg-white bg-opacity-20 backdrop-blur-lg text-white px-4 py-2 rounded-xl hover:bg-opacity-30 transition duration-300 font-semibold"
          >
            {showGraph ? 'Hide' : 'Show'} Dependency Graph
          </button>
          
          {todos.length > 1 && (
            <div className="flex gap-2 items-center bg-white bg-opacity-20 backdrop-blur-lg rounded-xl p-2">
              <select
                value={selectedTodo || ''}
                onChange={(e) => setSelectedTodo(Number(e.target.value))}
                className="p-2 rounded-lg text-gray-700"
              >
                <option value="">Select task...</option>
                {todos.map(todo => (
                  <option key={todo.id} value={todo.id}>{todo.title}</option>
                ))}
              </select>
              
              <span className="text-white">depends on</span>
              
              <select
                value={selectedDependency || ''}
                onChange={(e) => setSelectedDependency(Number(e.target.value))}
                className="p-2 rounded-lg text-gray-700"
              >
                <option value="">Select dependency...</option>
                {todos
                  .filter(todo => todo.id !== selectedTodo)
                  .map(todo => (
                    <option key={todo.id} value={todo.id}>{todo.title}</option>
                  ))}
              </select>
              
              <button
                onClick={handleAddDependency}
                disabled={!selectedTodo || !selectedDependency}
                className="bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Dependency Graph Visualization */}
        {showGraph && graph && (
          <div className="bg-white bg-opacity-90 p-6 rounded-xl shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Dependency Graph</h2>
            <DependencyGraphVisualization graph={graph} />
          </div>
        )}

        {/* Todo List */}
        <ul className="space-y-3">
          {todos.map((todo: TodoWithDependencies) => (
            <li
              key={todo.id}
              className={`bg-white bg-opacity-90 p-4 rounded-xl shadow-lg hover:bg-opacity-100 transition duration-300 ${
                todo.isCritical ? 'ring-2 ring-red-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Todo Image */}
                <TodoImage imageUrl={todo.imageUrl} title={todo.title} />
                
                {/* Todo Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-medium">{todo.title}</span>
                    {todo.isCritical && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                        Critical Path
                      </span>
                    )}
                  </div>
                  
                  {/* Task Details */}
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <div>Duration: {todo.duration} day{todo.duration !== 1 ? 's' : ''}</div>
                    
                    {todo.dueDate && (
                      <div className={`font-semibold ${
                        isOverdue(todo.dueDate) ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        Due: {formatDate(todo.dueDate)}
                        {isOverdue(todo.dueDate) && (
                          <span className="ml-2 text-red-600 font-bold">⚠️ OVERDUE</span>
                        )}
                      </div>
                    )}
                    
                    {todo.earliestStart && (
                      <div className="text-xs">
                        Can start: {formatDate(todo.earliestStart.toString())} | 
                        Must finish by: {formatDate(todo.latestFinish?.toString())}
                      </div>
                    )}
                  </div>
                  
                  {/* Dependencies */}
                  {todo.dependencies.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Depends on:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {todo.dependencies.map(dep => (
                          <span
                            key={dep.id}
                            className="text-xs bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
                          >
                            {dep.dependency.title}
                            <button
                              onClick={() => handleRemoveDependency(todo.id, dep.dependency.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
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
              </div>
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

// Dependency Graph Visualization Component
function DependencyGraphVisualization({ graph }: { graph: DependencyGraph }) {
  const { todos, dependencies, criticalPath } = graph;
  
  // Simple layout algorithm - arrange in columns based on dependencies
  const getNodePosition = (todoId: number, index: number) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return { x: 0, y: 0 };
    
    const level = todo.dependencies.length;
    const x = 150 + level * 200;
    const y = 50 + index * 100;
    
    return { x, y };
  };
  
  return (
    <div className="relative w-full h-96 overflow-auto border rounded-lg bg-gray-50">
      <svg width="800" height="600" className="w-full h-full">
        {/* Draw dependencies as lines */}
        {dependencies.map(dep => {
          const fromIndex = todos.findIndex(t => t.id === dep.dependencyId);
          const toIndex = todos.findIndex(t => t.id === dep.dependentId);
          const from = getNodePosition(dep.dependencyId, fromIndex);
          const to = getNodePosition(dep.dependentId, toIndex);
          const isCritical = criticalPath.includes(dep.dependencyId) && criticalPath.includes(dep.dependentId);
          
          return (
            <g key={`${dep.dependencyId}-${dep.dependentId}`}>
              <line
                x1={from.x + 60}
                y1={from.y}
                x2={to.x - 60}
                y2={to.y}
                stroke={isCritical ? '#ef4444' : '#d1d5db'}
                strokeWidth={isCritical ? 3 : 2}
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        })}
        
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6b7280"
            />
          </marker>
        </defs>
        
        {/* Draw nodes */}
        {todos.map((todo, index) => {
          const pos = getNodePosition(todo.id, index);
          const isCritical = criticalPath.includes(todo.id);
          
          return (
            <g key={todo.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <rect
                x="-60"
                y="-20"
                width="120"
                height="40"
                rx="8"
                fill={isCritical ? '#ef4444' : '#f97316'}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              <text
                textAnchor="middle"
                y="0"
                fill="white"
                fontSize="12"
                fontWeight="600"
              >
                {todo.title.substring(0, 15)}
                {todo.title.length > 15 ? '...' : ''}
              </text>
              <text
                textAnchor="middle"
                y="15"
                fill="white"
                fontSize="10"
              >
                {todo.duration}d
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}