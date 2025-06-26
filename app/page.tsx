"use client"
import { useState, useEffect } from 'react';
import { TodoWithRelations, Todo } from '@/lib/types';

// Use the properly typed Todo with all relations
type TodoWithDependencies = TodoWithRelations;

interface DependencyGraph {
  todos: TodoWithDependencies[];
  dependencies: Array<{
    id: number;
    dependentId: number;
    dependencyId: number;
    dependent: Todo;
    dependency: Todo;
  }>;
  criticalPath: number[];
}

// Enhanced gradient options
const GRADIENT_THEMES = {
  cosmic: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
  sunset: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
  ocean: 'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800',
  forest: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800',
  cyberpunk: 'bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700',
  professional: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black',
};

// WORKING Dependency Graph Visualization Component
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
  
  if (todos.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No tasks available for graph visualization
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-96 overflow-auto border rounded-lg bg-white/10 backdrop-blur-lg">
      <svg width="800" height="600" className="w-full h-full">
        {/* Draw dependencies as lines */}
        {dependencies.map((dep, idx) => {
          const fromIndex = todos.findIndex(t => t.id === dep.dependencyId);
          const toIndex = todos.findIndex(t => t.id === dep.dependentId);
          
          if (fromIndex === -1 || toIndex === -1) return null;
          
          const from = getNodePosition(dep.dependencyId, fromIndex);
          const to = getNodePosition(dep.dependentId, toIndex);
          const isCritical = criticalPath.includes(dep.dependencyId) && criticalPath.includes(dep.dependentId);
          
          return (
            <g key={`${dep.dependencyId}-${dep.dependentId}-${idx}`}>
              <line
                x1={from.x + 60}
                y1={from.y}
                x2={to.x - 60}
                y2={to.y}
                stroke={isCritical ? '#ef4444' : '#ffffff'}
                strokeWidth={isCritical ? 3 : 2}
                strokeOpacity={isCritical ? 1 : 0.6}
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
              fill="#ffffff"
              fillOpacity="0.8"
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
                fill={isCritical ? '#ef4444' : '#8b5cf6'}
                fillOpacity="0.9"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
              <text
                textAnchor="middle"
                y="-2"
                fill="white"
                fontSize="12"
                fontWeight="600"
              >
                {todo.title.substring(0, 15)}
                {todo.title.length > 15 ? '...' : ''}
              </text>
              <text
                textAnchor="middle"
                y="12"
                fill="white"
                fontSize="10"
                fillOpacity="0.8"
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

// TodoImage component with loading state
const TodoImage = ({ imageUrl, title }: { imageUrl?: string | null; title: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!imageUrl) {
    return (
      <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/20 border border-white/30 shadow-lg flex-shrink-0">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="w-full h-full bg-white/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={`Visual representation of ${title}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default function EnhancedHome() {
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDuration, setNewDuration] = useState('1');
  const [todos, setTodos] = useState<TodoWithDependencies[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<number | null>(null);
  const [selectedDependency, setSelectedDependency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<keyof typeof GRADIENT_THEMES>('cosmic');

  useEffect(() => {
    fetchTodos();
    fetchGraph();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setTodos(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setError('Failed to load todos. Please check your setup.');
    }
  };

  const fetchGraph = async () => {
    try {
      const res = await fetch('/api/todos/graph');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setGraph(data);
    } catch (error) {
      console.error('Failed to fetch graph:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    
    setIsCreating(true);
    setError(null);
    
    try {
      const payload: { title: string; dueDate?: string; duration?: number } = { 
        title: newTodo,
        duration: parseInt(newDuration) || 1
      };
      
      if (newDueDate) {
        payload.dueDate = newDueDate;
      }

      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create todo');
      }
      
      setNewTodo('');
      setNewDueDate('');
      setNewDuration('1');
      fetchTodos();
      fetchGraph();
    } catch (error) {
      console.error('Failed to add todo:', error);
      setError(error instanceof Error ? error.message : 'Failed to add todo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete todo');
      }
      
      fetchTodos();
      fetchGraph();
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setError('Failed to delete todo');
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
      const res = await fetch(`/api/todos/${dependentId}/dependencies/${dependencyId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to remove dependency');
      }
      
      fetchTodos();
      fetchGraph();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
      setError('Failed to remove dependency');
    }
  };

  const isOverdue = (dueDate: string | Date | null | undefined): boolean => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatDate = (date: string | Date | null | undefined): string => {
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

  return (
    <div className={`min-h-screen ${GRADIENT_THEMES[currentTheme]} p-6 relative transition-all duration-1000 ease-in-out`}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Theme Switcher */}
      <div className="fixed top-6 right-6 z-50">
        <select
          value={currentTheme}
          onChange={(e) => setCurrentTheme(e.target.value as keyof typeof GRADIENT_THEMES)}
          className="bg-white/20 backdrop-blur-lg text-white p-3 rounded-xl border border-white/30"
        >
          <option value="cosmic" className="text-gray-800">🌌 Cosmic</option>
          <option value="sunset" className="text-gray-800">🌅 Sunset</option>
          <option value="ocean" className="text-gray-800">🌊 Ocean</option>
          <option value="forest" className="text-gray-800">🌲 Forest</option>
          <option value="cyberpunk" className="text-gray-800">🦾 Cyberpunk</option>
          <option value="professional" className="text-gray-800">👔 Professional</option>
        </select>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        

        {/* Enhanced Input Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-2xl">
          <div className="space-y-4">
            {/* Task Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="What needs to be done? ✨"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full p-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300 text-lg"
              />
            </div>

            {/* Date and Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-4 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300"
                />
                <label className="absolute -top-2 left-3 bg-gradient-to-r from-purple-400 to-pink-400 px-2 py-1 rounded text-xs font-semibold text-white">
                  Due Date
                </label>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  placeholder="Duration"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="w-full p-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300"
                />
                <label className="absolute -top-2 left-3 bg-gradient-to-r from-blue-400 to-cyan-400 px-2 py-1 rounded text-xs font-semibold text-white">
                  Days
                </label>
              </div>

              <button
                onClick={handleAddTodo}
                disabled={!newTodo.trim() || isCreating}
                className="p-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Add Task</span>
                    <span className="text-lg">🚀</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-lg border border-red-500/50 text-white p-4 rounded-xl mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Enhanced Stats Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{todos.length}</div>
              <div className="text-white/70 font-medium">Total Tasks</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">
                {graph?.criticalPath?.length || 0}
              </div>
              <div className="text-white/70 font-medium">Critical Path</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">
                {todos.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length}
              </div>
              <div className="text-white/70 font-medium">Overdue</div>
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="bg-white/15 backdrop-blur-lg text-white px-6 py-3 rounded-xl hover:bg-white/25 transition-all duration-300 font-semibold border border-white/30 transform hover:scale-105"
          >
            <span className="mr-2">{showGraph ? '📊' : '🕸️'}</span>
            {showGraph ? 'Hide' : 'Show'} Dependency Graph
          </button>
          
          {todos.length > 1 && (
            <div className="flex gap-2 items-center bg-white/15 backdrop-blur-lg rounded-xl p-3 flex-wrap border border-white/30">
              <select
                value={selectedTodo || ''}
                onChange={(e) => setSelectedTodo(Number(e.target.value))}
                className="p-2 rounded-lg bg-white/20 text-white border border-white/30"
              >
                <option value="">Select task...</option>
                {todos.map(todo => (
                  <option key={todo.id} value={todo.id} className="text-gray-800">
                    {todo.title}
                  </option>
                ))}
              </select>
              
              <span className="text-white font-medium">depends on</span>
              
              <select
                value={selectedDependency || ''}
                onChange={(e) => setSelectedDependency(Number(e.target.value))}
                className="p-2 rounded-lg bg-white/20 text-white border border-white/30"
              >
                <option value="">Select dependency...</option>
                {todos
                  .filter(todo => todo.id !== selectedTodo)
                  .map(todo => (
                    <option key={todo.id} value={todo.id} className="text-gray-800">
                      {todo.title}
                    </option>
                  ))}
              </select>
              
              <button
                onClick={handleAddDependency}
                disabled={!selectedTodo || !selectedDependency}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <span className="mr-1">🔗</span>
                Add Link
              </button>
            </div>
          )}
        </div>

        {/* WORKING Enhanced Dependency Graph */}
        {showGraph && graph && (
          <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl mb-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                🕸️ Dependency Network
              </span>
            </h2>
            <DependencyGraphVisualization graph={graph} />
          </div>
        )}

        {/* Enhanced Todo List */}
        <div className="space-y-4">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`group bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl hover:bg-white/15 transition-all duration-300 border border-white/20 transform hover:scale-[1.02] ${
                todo.isCritical ? 'ring-2 ring-red-400/50 shadow-red-500/20' : ''
              }`}
            >
              <div className="flex items-start gap-6">
                {/* Enhanced Todo Image */}
                <div className="relative">
                  <TodoImage imageUrl={todo.imageUrl} title={todo.title} />
                  {todo.isCritical && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                      🔥
                    </div>
                  )}
                </div>
                
                {/* Enhanced Todo Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-white">{todo.title}</h3>
                    {todo.isCritical && (
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                        Critical Path
                      </span>
                    )}
                  </div>
                  
                  {/* Enhanced Task Details */}
                  <div className="text-white/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⏱️</span>
                      <span>Duration: {todo.duration} day{todo.duration !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {todo.dueDate && (
                      <div className={`flex items-center gap-2 font-semibold ${
                        isOverdue(todo.dueDate) ? 'text-red-300' : 'text-white/80'
                      }`}>
                        <span className="text-sm">📅</span>
                        <span>Due: {formatDate(todo.dueDate)}</span>
                        {isOverdue(todo.dueDate) && (
                          <span className="bg-red-500/80 text-white px-2 py-1 rounded text-xs animate-pulse">
                            ⚠️ OVERDUE
                          </span>
                        )}
                      </div>
                    )}
                    
                    {todo.dependencies && todo.dependencies.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm text-white/60 block mb-2">🔗 Dependencies:</span>
                        <div className="flex flex-wrap gap-2">
                          {todo.dependencies.map((dep: any) => (
                            <span
                              key={dep.id}
                              className="bg-white/20 text-white text-sm px-3 py-1 rounded-full border border-white/30 flex items-center gap-2"
                            >
                              {dep.dependency.title}
                              <button
                                onClick={() => handleRemoveDependency(todo.id, dep.dependency.id)}
                                className="text-red-300 hover:text-red-100 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Enhanced Delete Button */}
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-300 hover:text-red-100 transition-all duration-300 p-3 rounded-xl hover:bg-red-500/20 group-hover:opacity-100 opacity-70"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {todos.length === 0 && !error && (
          <div className="text-center text-white/70 mt-16">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-2xl font-light mb-2">Ready to conquer your goals?</p>
            <p className="text-lg">Add your first task above and let's get started!</p>
          </div>
        )}
      </div>

      {/* Custom CSS for animation delays */}
      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}