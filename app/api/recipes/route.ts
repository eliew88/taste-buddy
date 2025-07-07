import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { prepareRecipeForDB, transformRecipeFromDB } from '@/lib/sqlite-helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    // Build where clause for SQLite
    const where: any = {};

    // Search functionality (SQLite compatible)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        // SQLite: Search in JSON fields using contains
        { ingredients: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      where.difficulty = difficulty;
    }

    // Fetch recipes
    const recipes = await prisma.recipe.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { favorites: true, ratings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Transform recipes from DB format to app format
    const transformedRecipes = recipes.map(recipe => {
      const transformed = transformRecipeFromDB(recipe);
      return {
        ...transformed,
        // Calculate average rating (same as before)
        avgRating: 0, // TODO: Calculate from ratings
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
    const body = await request.json();
    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookTime, 
      servings, 
      difficulty, 
      tags 
    } = body;

    // Validation (same as before)
    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Recipe title is required' },
        { status: 400 }
      );
    }

    if (!ingredients || (Array.isArray(ingredients) ? ingredients.length === 0 : !ingredients.trim())) {
      return NextResponse.json(
        { success: false, error: 'At least one ingredient is required' },
        { status: 400 }
      );
    }

    if (!instructions?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Cooking instructions are required' },
        { status: 400 }
      );
    }

    // TODO: Get actual user ID from authentication
    const userId = 'temp-user-id';

    // Prepare data for SQLite storage
    const recipeData = prepareRecipeForDB({
      title: title.trim(),
      description: description?.trim() || null,
      ingredients,
      instructions: instructions.trim(),
      cookTime: cookTime?.trim() || null,
      servings: servings ? Math.max(1, parseInt(servings)) : null,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'easy',
      tags: tags || [],
      authorId: userId,
    });

    // Create recipe in database
    const recipe = await prisma.recipe.create({
      data: recipeData,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { favorites: true, ratings: true },
        },
      },
    });

    // Transform back to app format
    const transformedRecipe = transformRecipeFromDB(recipe);

    return NextResponse.json(
      { success: true, data: transformedRecipe }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}