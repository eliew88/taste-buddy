// app/api/meals/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '6')));

    // Fetch recent meals from all users (public data)
    const meals = await prisma.meal.findMany({
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: meals,
    });
  } catch (error) {
    console.error('Error fetching recent meals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent meals' },
      { status: 500 }
    );
  }
}