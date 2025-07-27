import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Get most popular recipes (by favorites count)
    const mostPopularRecipes = await prisma.recipe.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        cookTime: true,
        servings: true,
        difficulty: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            caption: true,
            alt: true,
            isPrimary: true,
            displayOrder: true
          },
          orderBy: [
            { isPrimary: 'desc' },
            { displayOrder: 'asc' }
          ]
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
        favorites: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // Get newest recipes
    const newestRecipes = await prisma.recipe.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        cookTime: true,
        servings: true,
        difficulty: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            caption: true,
            alt: true,
            isPrimary: true,
            displayOrder: true
          },
          orderBy: [
            { isPrimary: 'desc' },
            { displayOrder: 'asc' }
          ]
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
      },
      take: 5
    });

    // Get highest rated recipes
    const recipesWithRatings = await prisma.recipe.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        cookTime: true,
        servings: true,
        difficulty: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            caption: true,
            alt: true,
            isPrimary: true,
            displayOrder: true
          },
          orderBy: [
            { isPrimary: 'desc' },
            { displayOrder: 'asc' }
          ]
        },
        ratings: {
          select: {
            rating: true
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
      where: {
        ratings: {
          some: {}
        }
      }
    });

    // Calculate average ratings and sort
    const recipesWithAvgRating = recipesWithRatings.map(recipe => {
      const avgRating = recipe.ratings.length > 0 
        ? recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length
        : 0;
      
      return {
        ...recipe,
        avgRating,
        ratings: undefined // Remove detailed ratings from response
      };
    }).filter(recipe => recipe._count.ratings >= 3) // Only include recipes with 3+ ratings
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    // Get platform statistics
    const platformStats = await prisma.$transaction([
      prisma.recipe.count(),
      prisma.meal.count(),
      prisma.user.count(),
      prisma.favorite.count(),
      prisma.rating.count()
    ]);

    const [totalRecipes, totalMeals, totalUsers, totalFavorites, totalRatings] = platformStats;

    // Get trending tags (most used in recent recipes)
    const trendingTags = await prisma.recipe.findMany({
      select: {
        tags: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    // Count tag frequency
    const tagCounts: { [key: string]: number } = {};
    trendingTags.forEach(recipe => {
      recipe.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const sortedTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({
      success: true,
      data: {
        mostPopular: mostPopularRecipes,
        newest: newestRecipes,
        highestRated: recipesWithAvgRating,
        platformStats: {
          totalRecipes,
          totalMeals,
          totalUsers,
          totalFavorites,
          totalRatings
        },
        trendingTags: sortedTags
      }
    });
  } catch (error) {
    console.error('Recipe stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}