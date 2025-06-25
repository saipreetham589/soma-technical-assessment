// app/api/todos/[id]/dependencies/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DependencyService } from '@/lib/dependencyServices';
import { Prisma, Todo } from '@prisma/client';

const todoSelect = {
  id: true,
  title: true,
  dueDate: true,
  imageUrl: true,
  duration: true,
  earliestStart: true,
  latestStart: true,
  earliestFinish: true,
  latestFinish: true,
  isCritical: true,
  createdAt: true,
} as const;

type TaskDependency = {
  id: number;
  dependentId: number;
  dependencyId: number;
};

interface Params {
  params: {
    id: string;
  };
}

// Add a dependency
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const dependentId = parseInt(params.id);
    const { dependencyId } = await request.json();
    
    if (!dependencyId) {
      return NextResponse.json({ error: 'Dependency ID is required' }, { status: 400 });
    }
    
    // Check for circular dependency
    const hasCircular = await DependencyService.detectCircularDependency(dependentId, dependencyId);
    if (hasCircular) {
      return NextResponse.json({ error: 'Circular dependency detected' }, { status: 400 });
    }
    
    // Create the dependency using raw SQL to avoid type issues
    const [dependency] = await prisma.$queryRaw<TaskDependency[]>`
      INSERT INTO TaskDependency (dependentId, dependencyId)
      VALUES (${dependentId}, ${dependencyId})
      RETURNING id, dependentId, dependencyId
    `;

    // Get the full dependency info
    const fullDependency = {
      ...dependency,
      dependent: await prisma.todo.findUnique({
        where: { id: dependentId },
        select: todoSelect,
      }),
      dependency: await prisma.todo.findUnique({
        where: { id: dependencyId },
        select: todoSelect,
      }),
    };
    
    // Recalculate critical path
    await DependencyService.calculateCriticalPath();
    
    return NextResponse.json(fullDependency);
  } catch (error) {
    console.error('Error creating dependency:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error creating dependency' }, { status: 500 });
  }
}

// Get all dependencies for a task
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const todoId = parseInt(params.id);
    
    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Get dependencies using raw SQL
    const dependencies = await prisma.$queryRaw<Todo[]>`
      SELECT t.*
      FROM Todo t
      JOIN TaskDependency td ON t.id = td.dependencyId
      WHERE td.dependentId = ${todoId}
    `;

    // Get dependents using raw SQL
    const dependents = await prisma.$queryRaw<Todo[]>`
      SELECT t.*
      FROM Todo t
      JOIN TaskDependency td ON t.id = td.dependentId
      WHERE td.dependencyId = ${todoId}
    `;

    return NextResponse.json({
      dependencies,
      dependents,
    });
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    return NextResponse.json(
      { error: 'Error fetching dependencies' },
      { status: 500 }
    );
  }
}