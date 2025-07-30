// app/api/users/[id]/meals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Resolve the params Promise to get the actual id
    const { id: userId } = await context.params;
    
    // Fetch only public meals created by the user
    const meals = await prisma.meal.findMany({
      where: {
        authorId: userId,
        isPublic: true // Only show public meals
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        taggedUsers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: meals,
    });
  } catch (error) {
    console.error('Error fetching user meals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user meals' },
      { status: 500 }
    );
  }
}