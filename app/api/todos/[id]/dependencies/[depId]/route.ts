// app/api/todos/[id]/dependencies/[depId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DependencyService } from '@/lib/dependencyServices';

interface Params {
  params: {
    id: string;
    depId: string;
  };
}

// Remove a dependency
export async function DELETE(request: Request, { params }: Params) {
  try {
    const dependentId = parseInt(params.id);
    const dependencyId = parseInt(params.depId);

    if (isNaN(dependentId) || isNaN(dependencyId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Check if dependency exists
    const dependency = await prisma.taskDependency.findUnique({
      where: {
        dependentId_dependencyId: {
          dependentId,
          dependencyId,
        },
      },
    });

    if (!dependency) {
      return NextResponse.json({ error: 'Dependency not found' }, { status: 404 });
    }

    // Delete the dependency
    await prisma.taskDependency.delete({
      where: {
        id: dependency.id,
      },
    });

    // Recalculate critical path
    await DependencyService.calculateCriticalPath();

    return NextResponse.json({ message: 'Dependency removed' }, { status: 200 });
  } catch (error) {
    console.error('Error removing dependency:', error);
    return NextResponse.json(
      { error: 'Error removing dependency' },
      { status: 500 }
    );
  }
}