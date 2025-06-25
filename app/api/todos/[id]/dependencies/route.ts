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
    
    // Create the dependency
    const dependency = await prisma.taskDependency.create({
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
    
    return NextResponse.json(dependency);
  } catch (error) {
    console.error('Error creating dependency:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error creating dependency' }, { status: 500 });
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
      dependencies: todo.dependencies.map((d: any) => d.dependency),
      dependents: todo.dependents.map((d: any) => d.dependent),
    });
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    return NextResponse.json(
      { error: 'Error fetching dependencies' },
      { status: 500 }
    );
  }
}