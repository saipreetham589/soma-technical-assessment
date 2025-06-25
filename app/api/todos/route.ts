import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pexelsService } from '@/lib/pexels';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
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
    const { title, dueDate } = await request.json();
    
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
      },
    });
    
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}