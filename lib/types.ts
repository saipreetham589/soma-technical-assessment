import { Prisma } from '@prisma/client';

// Get the type of Todo with all relations included
export type TodoWithRelations = Prisma.TodoGetPayload<{
  include: {
    dependencies: {
      include: {
        dependency: true;
      };
    };
    dependents: {
      include: {
        dependent: true;
      };
    };
  };
}>;

// TaskDependency with relations
export type TaskDependencyWithRelations = Prisma.TaskDependencyGetPayload<{
  include: {
    dependent: true;
    dependency: true;
  };
}>;

// Re-export the base types
export type { Todo, TaskDependency } from '@prisma/client'; 