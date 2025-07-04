import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DependencyService } from '@/lib/dependencyServices';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; dependencyId: string } }
) {
  try {
    const dependentId = parseInt(params.id);
    const dependencyId = parseInt(params.dependencyId);
    
    await prisma.$executeRaw`
      DELETE FROM TaskDependency
      WHERE dependentId = ${dependentId}
      AND dependencyId = ${dependencyId}
    `;
    
    // Recalculate critical path
    await DependencyService.calculateCriticalPath();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dependency:', error);
    return NextResponse.json({ error: 'Error deleting dependency' }, { status: 500 });
  }
} 