// app/api/todos/graph/route.ts

import { NextResponse } from 'next/server';
import { DependencyService } from '@/lib/dependencyServices';

// Get the complete dependency graph
export async function GET() {
  try {
    const graph = await DependencyService.getDependencyGraph();
    const { criticalPath } = await DependencyService.calculateCriticalPath();
    
    return NextResponse.json({
      ...graph,
      criticalPath,
    });
  } catch (error) {
    console.error('Error fetching dependency graph:', error);
    return NextResponse.json(
      { error: 'Error fetching dependency graph' },
      { status: 500 }
    );
  }
}