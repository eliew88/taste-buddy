// app/api/meals/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tastebuddiesOnly = searchParams.get('tastebuddiesOnly') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    // Get authenticated user ID (optional for public endpoint)
    const userId = await getCurrentUserId();

    // Base where clause - always show only public meals
    let where: any = {
      isPublic: true
    };

    // If user is authenticated and wants TasteBuddies only
    if (userId && tastebuddiesOnly) {
      // Get the list of users that the current user follows
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });
      
      const followingIds = following.map(f => f.followingId);
      
      // Get TasteBuddies (mutual follows)
      const tastebuddies = await prisma.user.findMany({
        where: {
          id: { in: followingIds },
          followers: {
            some: {
              followerId: userId
            }
          }
        },
        select: { id: true }
      });
      
      const tastebuddyIds = tastebuddies.map(tb => tb.id);
      
      // Filter to only show meals from TasteBuddies
      where = {
        ...where,
        authorId: { in: tastebuddyIds }
      };
    }

    // Search functionality
    if (search) {
      where = {
        ...where,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      };
    }

    // Fetch public meals
    const meals = await prisma.meal.findMany({
      where,
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
      skip,
      take: limit,
    });

    const total = await prisma.meal.count({ where });

    return NextResponse.json({
      success: true,
      data: meals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching public meals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}