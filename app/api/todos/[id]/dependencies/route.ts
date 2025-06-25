// app/api/todos/[id]/dependencies/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DependencyService } from '@/lib/dependencyServices';

interface Params {
  params: {
    id: string;
  };
}

// Add a dependency
export async function POST(request: Request, { params }: Params) {
  try {
    const dependentId = parseInt(params.id);
    const { dependencyId } = await request.json();

    if (isNaN(dependentId) || isNaN(dependencyId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    if (dependentId === dependencyId) {
      return NextResponse.json({ error: 'A task cannot depend on itself' }, { status: 400 });
    }

    // Check if both tasks exist
    const [dependent, dependency] = await Promise.all([
      prisma.todo.findUnique({ where: { id: dependentId } }),
      prisma.todo.findUnique({ where: { id: dependencyId } }),
    ]);

    if (!dependent || !dependency) {
      return NextResponse.json({ error: 'One or both tasks not found' }, { status: 404 });
    }

    // Check for circular dependency
    const hasCircularDep = await DependencyService.detectCircularDependency(
      dependentId,
      dependencyId
    );

    if (hasCircularDep) {
      return NextResponse.json(
        { error: 'This dependency would create a circular reference' },
        { status: 400 }
      );
    }

    // Check if dependency already exists
    const existingDep = await prisma.taskDependency.findUnique({
      where: {
        dependentId_dependencyId: {
          dependentId,
          dependencyId,
        },
      },
    });

    if (existingDep) {
      return NextResponse.json(
        { error: 'This dependency already exists' },
        { status: 400 }
      );
    }

    // Create the dependency
    const taskDependency = await prisma.taskDependency.create({
      data: {
        dependentId,
        dependencyId,
      },
      include: {
        dependent: true,
        dependency: true,
      },
    });

    // Recalculate critical path
    await DependencyService.calculateCriticalPath();

    return NextResponse.json(taskDependency, { status: 201 });
  } catch (error) {
    console.error('Error creating dependency:', error);
    return NextResponse.json(
      { error: 'Error creating dependency' },
      { status: 500 }
    );
  }
}

// Get all dependencies for a task
export async function GET(request: Request, { params }: Params) {
  try {
    const todoId = parseInt(params.id);
    
    if (isNaN(todoId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
      include: {
        dependencies: {
          include: {
            dependency: true,
          },
        },
        dependents: {
          include: {
            dependent: true,
          },
        },
      },
    });

    if (!todo) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      dependencies: todo.dependencies.map(d => d.dependency),
      dependents: todo.dependents.map(d => d.dependent),
    });
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    return NextResponse.json(
      { error: 'Error fetching dependencies' },
      { status: 500 }
    );
  }
}