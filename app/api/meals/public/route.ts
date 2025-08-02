// app/api/meals/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserWithPrivacy } from '@/lib/privacy-utils';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const recipePoster = searchParams.get('recipePoster') || 'everyone';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    // Get authenticated user ID (optional for public endpoint)
    const userId = await getCurrentUserId();

    // Base where clause - always show only public meals
    let where: any = {
      isPublic: true
    };

    // Apply recipe poster filtering
    if (userId && recipePoster !== 'everyone') {
      switch (recipePoster) {
        case 'following':
          // Get the list of users that the current user follows
          const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true }
          });
          
          const followingIds = following.map(f => f.followingId);
          
          // Filter to only show meals from users you follow
          where = {
            ...where,
            authorId: { in: followingIds }
          };
          break;
          
        case 'my-own':
          // Filter to only show your own meals
          where = {
            ...where,
            authorId: userId
          };
          break;
          
        default:
          // 'everyone' or unknown value - no additional filtering
          break;
      }
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
          select: { id: true, name: true, image: true },
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        taggedUsers: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.meal.count({ where });

    // Apply privacy filtering to meal authors and tagged users
    const mealsWithPrivacy = await Promise.all(
      meals.map(async (meal) => {
        // Apply privacy to meal author
        const authorWithPrivacy = await getUserWithPrivacy(meal.author.id, session?.user?.id);
        
        // Apply privacy to tagged users
        const taggedUsersWithPrivacy = await Promise.all(
          meal.taggedUsers.map(async (tag) => ({
            ...tag,
            user: await getUserWithPrivacy(tag.user.id, session?.user?.id)
          }))
        );

        return {
          ...meal,
          author: authorWithPrivacy,
          taggedUsers: taggedUsersWithPrivacy
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: mealsWithPrivacy,
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