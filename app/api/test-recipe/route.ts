import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { prepareRecipeForDB, isPostgreSQL } from '@/lib/db-helpers';

export async function POST(request: NextRequest) {
  try {
    console.log('[TEST-RECIPE] Starting recipe creation test...');
    
    // Test 1: Check environment
    const envCheck = {
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      databaseProtocol: process.env.DATABASE_URL?.split('://')[0] || 'UNKNOWN',
      isPostgreSQL: isPostgreSQL(),
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL
    };
    console.log('[TEST-RECIPE] Environment check:', envCheck);

    // Test 2: Check authentication
    const userId = await getCurrentUserId();
    console.log('[TEST-RECIPE] User ID:', userId ? 'FOUND' : 'NOT FOUND');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        debug: { envCheck, userId: 'NOT_FOUND' }
      }, { status: 401 });
    }

    // Test 3: Parse request body
    const body = await request.json();
    console.log('[TEST-RECIPE] Request body keys:', Object.keys(body));
    console.log('[TEST-RECIPE] Ingredients type:', typeof body.ingredients, Array.isArray(body.ingredients));
    console.log('[TEST-RECIPE] Tags type:', typeof body.tags, Array.isArray(body.tags));

    // Test 4: Prepare data using helper
    const testData = {
      title: body.title || 'Test Recipe',
      description: body.description || 'Test description',
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : ['test ingredient'],
      instructions: body.instructions || 'Test instructions',
      cookTime: body.cookTime || '30 minutes',
      servings: body.servings ? Math.max(1, parseInt(body.servings)) : 4,
      difficulty: 'easy',
      tags: Array.isArray(body.tags) ? body.tags : ['test'],
      authorId: userId,
    };

    console.log('[TEST-RECIPE] Prepared data types:', {
      title: typeof testData.title,
      ingredients: typeof testData.ingredients,
      tags: typeof testData.tags,
      authorId: typeof testData.authorId
    });

    const recipeData = prepareRecipeForDB(testData);
    console.log('[TEST-RECIPE] After prepareRecipeForDB types:', {
      ingredients: typeof recipeData.ingredients,
      tags: typeof recipeData.tags
    });

    // Test 5: Try database connection
    console.log('[TEST-RECIPE] Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('[TEST-RECIPE] User count:', userCount);

    // Test 6: Try to create recipe
    console.log('[TEST-RECIPE] Attempting to create recipe...');
    const recipe = await prisma.recipe.create({
      data: recipeData as any,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log('[TEST-RECIPE] Recipe created successfully:', recipe.id);

    return NextResponse.json({
      success: true,
      message: 'Recipe created successfully',
      debug: {
        envCheck,
        userId: 'FOUND',
        recipeId: recipe.id,
        dataTypes: {
          ingredients: typeof recipeData.ingredients,
          tags: typeof recipeData.tags
        }
      }
    });

  } catch (error) {
    console.error('[TEST-RECIPE] Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}