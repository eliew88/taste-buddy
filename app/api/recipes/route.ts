// app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { createNewRecipeNotification } from '@/lib/notification-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const featured = searchParams.get('featured') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    // Build where clause for SQLite (no mode: 'insensitive' support)
    const where: Record<string, unknown> = {};

    // Search functionality (PostgreSQL with case-insensitive search)
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        // Search in structured ingredients
        { ingredients: { some: { ingredient: { contains: search, mode: 'insensitive' } } } },
        { tags: { hasSome: [searchLower] } },
      ];
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      where.difficulty = difficulty;
    }

    // For featured recipes, only get recipes with images
    if (featured) {
      where.image = { not: null };
    }

    // Fetch recipes with rating aggregation
    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        ingredients: true,
        _count: {
          select: { favorites: true, ratings: true, comments: true },
        },
        ratings: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Transform recipes for response (native PostgreSQL arrays need no transformation)
    const transformedRecipes = recipes.map(recipe => {
      // Calculate average rating from ratings array
      const totalRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = recipe.ratings.length > 0 ? totalRating / recipe.ratings.length : 0;


      return {
        ...recipe,
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        // Remove ratings array from response for cleaner API
        ratings: undefined,
      };
    });

    const total = await prisma.recipe.count({ where });

    return NextResponse.json({
      success: true,
      data: transformedRecipes,
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
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== RECIPE CREATION START ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookTime, 
      servings, 
      difficulty, 
      tags,
      image 
    } = body;
    
    console.log('Extracted fields:', {
      title: title?.slice(0, 50) + '...',
      hasDescription: !!description,
      ingredientsCount: Array.isArray(ingredients) ? ingredients.length : 'not array',
      hasInstructions: !!instructions,
      cookTime,
      servings,
      difficulty,
      tagsCount: Array.isArray(tags) ? tags.length : 'not array',
      hasImage: !!image
    });

    // Validation
    console.log('Starting validation...');
    if (!title?.trim()) {
      console.log('Validation failed: No title');
      return NextResponse.json(
        { success: false, error: 'Recipe title is required' },
        { status: 400 }
      );
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      console.log('Validation failed: Invalid ingredients', { ingredients });
      return NextResponse.json(
        { success: false, error: 'At least one ingredient is required' },
        { status: 400 }
      );
    }

    // Validate ingredients structure
    console.log('Validating ingredients structure...');
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      console.log(`Ingredient ${i}:`, ingredient);
      if (!ingredient.amount || !ingredient.ingredient?.trim()) {
        console.log(`Validation failed: Invalid ingredient ${i}`, ingredient);
        return NextResponse.json(
          { success: false, error: 'Each ingredient must have amount and ingredient name' },
          { status: 400 }
        );
      }
    }

    if (!instructions?.trim()) {
      console.log('Validation failed: No instructions');
      return NextResponse.json(
        { success: false, error: 'Cooking instructions are required' },
        { status: 400 }
      );
    }
    console.log('All validation passed!');

    // Get authenticated user ID
    console.log('Getting user ID...');
    const userId = await getCurrentUserId();
    console.log('User ID:', userId);
    
    if (!userId) {
      console.log('Authentication failed: No user ID');
      return NextResponse.json(
        { success: false, error: 'Authentication required to create recipes' },
        { status: 401 }
      );
    }

    // Prepare data for PostgreSQL database storage with structured ingredients
    console.log('Preparing recipe data...');
    const recipeData = {
      title: title.trim(),
      description: description?.trim() || null,
      instructions: instructions.trim(),
      cookTime: cookTime?.trim() || null,
      servings: servings ? Math.max(1, parseInt(servings)) : null,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy',
      tags: Array.isArray(tags) ? tags : [],
      image: image?.trim() || null,
      authorId: userId,
      ingredients: {
        create: ingredients.map((ingredient: any, index: number) => {
          const parsed = {
            amount: parseFloat(ingredient.amount),
            unit: ingredient.unit?.trim() || null,
            ingredient: ingredient.ingredient.trim(),
          };
          console.log(`Mapped ingredient ${index}:`, parsed);
          return parsed;
        })
      }
    };
    
    console.log('Recipe data prepared:', {
      title: recipeData.title,
      hasDescription: !!recipeData.description,
      ingredientsCount: recipeData.ingredients.create.length,
      hasInstructions: !!recipeData.instructions,
      authorId: recipeData.authorId,
      hasImage: !!recipeData.image
    });

    // Create recipe in database
    console.log('Creating recipe in database...');
    const recipe = await prisma.recipe.create({
      data: recipeData,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        ingredients: true,
        _count: {
          select: { favorites: true, ratings: true, comments: true },
        },
      },
    });
    
    console.log('Recipe created successfully:', {
      id: recipe.id,
      title: recipe.title,
      ingredientsCount: recipe.ingredients.length,
      authorId: recipe.authorId
    });

    // Notify followers about the new recipe
    try {
      console.log('Creating notifications for new recipe...');
      
      // Get the author's followers
      const followers = await prisma.follow.findMany({
        where: { followingId: recipe.authorId },
        select: { followerId: true }
      });
      
      if (followers.length > 0) {
        const followerIds = followers.map(f => f.followerId);
        const authorName = recipe.author.name || recipe.author.email;
        
        await createNewRecipeNotification(
          recipe.authorId,
          recipe.id,
          recipe.title,
          authorName,
          followerIds
        );
        
        console.log(`Created notifications for ${followerIds.length} followers`);
      }
    } catch (error) {
      console.error('Failed to create recipe notifications:', error);
      // Don't fail the recipe creation if notifications fail
    }

    // Recipe data is ready for response (no transformation needed with PostgreSQL)
    const transformedRecipe = {
      ...recipe,
      avgRating: 0, // New recipes start with 0 rating
    };

    console.log('Returning successful response');
    console.log('=== RECIPE CREATION SUCCESS ===');
    return NextResponse.json(
      { success: true, data: transformedRecipe }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('=== RECIPE CREATION ERROR ===');
    console.error('Error creating recipe:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      databaseProtocol: process.env.DATABASE_URL?.split('://')[0] || 'UNKNOWN'
    });
    console.error('=== END RECIPE CREATION ERROR ===');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create recipe',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}