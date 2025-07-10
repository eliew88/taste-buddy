import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    // Get user's recipes with stats
    const recipes = await prisma.recipe.findMany({
      where: {
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            favorites: true,
            ratings: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating for each recipe
    const recipesWithRatings = await Promise.all(
      recipes.map(async (recipe) => {
        const ratingStats = await prisma.rating.aggregate({
          where: { recipeId: recipe.id },
          _avg: { rating: true },
          _count: { rating: true }
        });

        return {
          ...recipe,
          avgRating: ratingStats._avg.rating || 0,
          ratingCount: ratingStats._count.rating || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: recipesWithRatings
    });
  } catch (error) {
    console.error('Get user recipes API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}