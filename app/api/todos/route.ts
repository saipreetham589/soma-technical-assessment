// app/api/todos/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pexelsService } from '@/lib/pexels';
import { DependencyService } from '@/lib/dependencyServices';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching todos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, dueDate, duration } = await request.json();
    
    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Parse and validate due date if provided
    let parsedDueDate = null;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json({ error: 'Invalid due date format' }, { status: 400 });
      }
    }

    // Validate duration
    const taskDuration = parseInt(duration) || 1;
    if (taskDuration < 1) {
      return NextResponse.json({ error: 'Duration must be at least 1 day' }, { status: 400 });
    }

    // Fetch relevant image from Pexels based on todo title
    let imageUrl = null;
    try {
      imageUrl = await pexelsService.searchPhotos(title);
      // If no specific image found, try fallback
      if (!imageUrl) {
        imageUrl = await pexelsService.getFallbackImage();
      }
    } catch (error) {
      console.warn('Failed to fetch image from Pexels:', error);
      // Continue without image - don't fail the todo creation
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: parsedDueDate,
        imageUrl,
        duration: taskDuration,
      },
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
    
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}