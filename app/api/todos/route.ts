// app/api/todos/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
  dependencies: {
    select: {
      id: true,
      dependentId: true,
      dependencyId: true,
      dependency: {
        select: {
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
        },
      },
    },
  },
  dependents: {
    select: {
      id: true,
      dependentId: true,
      dependencyId: true,
      dependent: {
        select: {
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
        },
      },
    },
  },
} as const;

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      select: todoSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
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

    // Create todo first
    const createData = {
      title,
      dueDate: parsedDueDate,
      duration: duration || 1,
    } as unknown as Prisma.TodoCreateInput;

    const todo = await prisma.todo.create({
      data: createData,
      select: todoSelect,
    });

    // Generate image URL using picsum
    const imageUrl = `https://picsum.photos/seed/${todo.id}/400/300`;
    
    // Update todo with image URL
    const updateData = {
      imageUrl,
    } as unknown as Prisma.TodoUpdateInput;

    const updatedTodo = await prisma.todo.update({
      where: { id: todo.id },
      data: updateData,
      select: todoSelect,
    });
    
    return NextResponse.json(updatedTodo, { status: 201 });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}