// lib/dependencyService.ts

import { prisma } from './prisma';
import { Prisma, Todo } from '@prisma/client';
import { TodoWithRelations } from './types';

// Use the typed version from our types file
type TodoWithDependencies = TodoWithRelations;
type TaskDependency = {
  id: number;
  dependentId: number;
  dependencyId: number;
};

type TodoWithDuration = Todo & {
  duration: number;
  dueDate: Date | null;
  imageUrl: string | null;
  earliestStart: Date | null;
  latestStart: Date | null;
  earliestFinish: Date | null;
  latestFinish: Date | null;
  isCritical: boolean;
};

export class DependencyService {
  /**
   * Detect circular dependencies using DFS with color marking
   * White (0) = unvisited, Gray (1) = visiting, Black (2) = visited
   */
  static async detectCircularDependency(
    fromTaskId: number,
    toTaskId: number
  ): Promise<boolean> {
    const todos = await prisma.todo.findMany();
    const deps = await prisma.$queryRaw<TaskDependency[]>`
      SELECT id, dependentId, dependencyId 
      FROM TaskDependency
    `;

    const adjacencyList = new Map<number, number[]>();
    todos.forEach(todo => {
      adjacencyList.set(
        todo.id,
        deps.filter(d => d.dependentId === todo.id).map(d => d.dependencyId)
      );
    });

    // Add the proposed dependency temporarily
    const currentDeps = adjacencyList.get(fromTaskId) || [];
    adjacencyList.set(fromTaskId, [...currentDeps, toTaskId]);

    const colors = new Map<number, number>();
    todos.forEach(todo => colors.set(todo.id, 0));

    const hasCycle = (nodeId: number): boolean => {
      colors.set(nodeId, 1); // Mark as visiting (Gray)

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const neighborColor = colors.get(neighbor) || 0;
        
        if (neighborColor === 1) {
          return true; // Found a cycle
        }
        
        if (neighborColor === 0 && hasCycle(neighbor)) {
          return true;
        }
      }

      colors.set(nodeId, 2); // Mark as visited (Black)
      return false;
    };

    // Check for cycles starting from any unvisited node
    const entries = Array.from(colors.entries());
    for (const [nodeId, color] of entries) {
      if (color === 0 && hasCycle(nodeId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate Critical Path using CPM algorithm
   */
  static async calculateCriticalPath(): Promise<{
    todos: TodoWithDependencies[],
    criticalPath: number[]
  }> {
    const todos = await prisma.todo.findMany() as TodoWithDuration[];
    const deps = await prisma.$queryRaw<TaskDependency[]>`
      SELECT id, dependentId, dependencyId 
      FROM TaskDependency
    `;

    // Build adjacency lists for forward and backward passes
    const forwardAdjList = new Map<number, number[]>();
    const backwardAdjList = new Map<number, number[]>();
    const todoMap = new Map<number, TodoWithDuration>();

    todos.forEach(todo => {
      todoMap.set(todo.id, todo);
      forwardAdjList.set(
        todo.id,
        deps.filter(d => d.dependencyId === todo.id).map(d => d.dependentId)
      );
      backwardAdjList.set(
        todo.id,
        deps.filter(d => d.dependentId === todo.id).map(d => d.dependencyId)
      );
    });

    // Topological sort for processing order
    const topologicalOrder = this.topologicalSort(todos, deps);

    // Initialize dates
    const earliestStart = new Map<number, number>();
    const earliestFinish = new Map<number, number>();
    const latestStart = new Map<number, number>();
    const latestFinish = new Map<number, number>();

    // Forward pass - Calculate earliest start and finish times
    topologicalOrder.forEach(todoId => {
      const todo = todoMap.get(todoId)!;
      const dependencies = backwardAdjList.get(todoId) || [];

      if (dependencies.length === 0) {
        // No dependencies, can start at day 0
        earliestStart.set(todoId, 0);
      } else {
        // Start after all dependencies finish
        const maxFinish = Math.max(
          ...dependencies.map(depId => earliestFinish.get(depId) || 0)
        );
        earliestStart.set(todoId, maxFinish);
      }

      earliestFinish.set(
        todoId,
        (earliestStart.get(todoId) || 0) + todo.duration
      );
    });

    // Find project completion time
    const projectDuration = Math.max(...Array.from(earliestFinish.values()));

    // Backward pass - Calculate latest start and finish times
    const reverseOrder = [...topologicalOrder].reverse();
    reverseOrder.forEach(todoId => {
      const todo = todoMap.get(todoId)!;
      const dependents = forwardAdjList.get(todoId) || [];

      if (dependents.length === 0) {
        // No dependents, latest finish is project duration
        latestFinish.set(todoId, earliestFinish.get(todoId) || projectDuration);
      } else {
        // Must finish before earliest dependent starts
        const minStart = Math.min(
          ...dependents.map(depId => latestStart.get(depId) || projectDuration)
        );
        latestFinish.set(todoId, minStart);
      }

      latestStart.set(
        todoId,
        (latestFinish.get(todoId) || 0) - todo.duration
      );
    });

    // Identify critical path (where slack = 0)
    const criticalPath: number[] = [];
    const updatedTodos: TodoWithDependencies[] = [];

    for (const todo of todos) {
      const slack = (latestStart.get(todo.id) || 0) - (earliestStart.get(todo.id) || 0);
      const isCritical = slack === 0;

      if (isCritical) {
        criticalPath.push(todo.id);
      }

      // Calculate actual dates based on today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const esStart = earliestStart.get(todo.id) || 0;
      const efFinish = earliestFinish.get(todo.id) || 0;
      const lsStart = latestStart.get(todo.id) || 0;
      const lfFinish = latestFinish.get(todo.id) || 0;

      // Update database
      const updateData = {
        earliestStart: new Date(today.getTime() + esStart * 24 * 60 * 60 * 1000),
        earliestFinish: new Date(today.getTime() + efFinish * 24 * 60 * 60 * 1000),
        latestStart: new Date(today.getTime() + lsStart * 24 * 60 * 60 * 1000),
        latestFinish: new Date(today.getTime() + lfFinish * 24 * 60 * 60 * 1000),
        isCritical
      } as const;

      await prisma.todo.update({
        where: { id: todo.id },
        data: updateData
      });

      // Add to result
      const dependencies = deps
        .filter(d => d.dependentId === todo.id)
        .map(d => ({
          ...d,
          dependency: todoMap.get(d.dependencyId)!
        }));

      const dependents = deps
        .filter(d => d.dependencyId === todo.id)
        .map(d => ({
          ...d,
          dependent: todoMap.get(d.dependentId)!
        }));

      updatedTodos.push({
        ...todo,
        dependencies,
        dependents
      } as TodoWithDependencies);
    }

    return { todos: updatedTodos, criticalPath };
  }

  /**
   * Topological sort using DFS
   */
  private static topologicalSort(todos: TodoWithDuration[], deps: TaskDependency[]): number[] {
    const visited = new Set<number>();
    const stack: number[] = [];
    const adjacencyList = new Map<number, number[]>();

    todos.forEach(todo => {
      adjacencyList.set(
        todo.id,
        deps.filter(d => d.dependentId === todo.id).map(d => d.dependencyId)
      );
    });

    const dfs = (nodeId: number) => {
      visited.add(nodeId);
      const neighbors = adjacencyList.get(nodeId) || [];
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }
      
      stack.push(nodeId);
    };

    todos.forEach(todo => {
      if (!visited.has(todo.id)) {
        dfs(todo.id);
      }
    });

    return stack.reverse();
  }

  /**
   * Get the dependency graph structure for visualization
   */
  static async getDependencyGraph() {
    const todos = await prisma.todo.findMany() as TodoWithDuration[];
    const deps = await prisma.$queryRaw<TaskDependency[]>`
      SELECT id, dependentId, dependencyId 
      FROM TaskDependency
    `;
    const todoMap = new Map(todos.map(t => [t.id, t]));

    const todosWithDeps = todos.map(todo => ({
      ...todo,
      dependencies: deps
        .filter(d => d.dependentId === todo.id)
        .map(d => ({
          ...d,
          dependency: todoMap.get(d.dependencyId)!
        })),
      dependents: deps
        .filter(d => d.dependencyId === todo.id)
        .map(d => ({
          ...d,
          dependent: todoMap.get(d.dependentId)!
        }))
    }));

    return { todos: todosWithDeps, dependencies: deps };
  }
}

export default DependencyService;