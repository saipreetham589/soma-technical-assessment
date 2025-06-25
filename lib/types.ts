import { Todo } from '@prisma/client';

// Get the type of Todo with all relations included
export type TodoWithRelations = Todo & {
  id: number;
  title: string;
  dueDate: Date | null;
  imageUrl: string | null;
  duration: number;
  earliestStart: Date | null;
  latestStart: Date | null;
  earliestFinish: Date | null;
  latestFinish: Date | null;
  isCritical: boolean;
  createdAt: Date;
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
};

// Re-export the base types
export type { Todo }; 