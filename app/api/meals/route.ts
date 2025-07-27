// app/api/meals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    // Get authenticated user ID for filtering user's meals
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      authorId: userId, // Only show user's own meals
    };

    // Search functionality (PostgreSQL with case-insensitive search)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch meals
    const meals = await prisma.meal.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
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
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== MEAL CREATION START ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));
    
    const { 
      name, 
      description, 
      date,
      images
    } = body;
    
    console.log('Extracted fields:', {
      name: name?.slice(0, 50) + '...',
      hasDescription: !!description,
      date,
      imagesCount: Array.isArray(images) ? images.length : 'not array'
    });

    // Validation
    console.log('Starting validation...');
    if (!name?.trim()) {
      console.log('Validation failed: No name');
      return NextResponse.json(
        { success: false, error: 'Meal name is required' },
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
        { success: false, error: 'Authentication required to create meals' },
        { status: 401 }
      );
    }

    // Verify the user exists in the database
    console.log('Verifying user exists...');
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    console.log('User exists check:', !!userExists);
    
    if (!userExists) {
      console.log('User verification failed: User does not exist in database');
      return NextResponse.json(
        { success: false, error: 'Invalid user session. Please sign in again.' },
        { status: 401 }
      );
    }

    // Prepare data for PostgreSQL database storage
    console.log('Preparing meal data...');
    
    // Prepare images data if provided
    let imagesData = undefined;
    if (Array.isArray(images) && images.length > 0) {
      console.log('Processing images data...');
      imagesData = {
        create: images.map((img: any, index: number) => {
          const imageData = {
            url: img.url,
            filename: img.filename || null,
            caption: img.caption || null,
            alt: img.alt || null,
            width: img.width || null,
            height: img.height || null,
            fileSize: img.fileSize || null,
            displayOrder: img.displayOrder !== undefined ? img.displayOrder : index,
            isPrimary: img.isPrimary === true || (index === 0 && !images.some((i: any) => i.isPrimary === true))
          };
          console.log(`Mapped image ${index}:`, imageData);
          return imageData;
        })
      };
    }
    
    const mealData = {
      name: name.trim(),
      description: description?.trim() || null,
      date: date ? new Date(date) : null,
      authorId: userId,
      ...(imagesData && { images: imagesData })
    };
    
    console.log('Meal data prepared:', {
      name: mealData.name,
      hasDescription: !!mealData.description,
      date: mealData.date,
      authorId: mealData.authorId,
      imagesCount: imagesData ? imagesData.create.length : 0
    });

    // Create meal in database
    console.log('Creating meal in database...');
    const meal = await prisma.meal.create({
      data: mealData,
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        images: {
          orderBy: { displayOrder: 'asc' }
        },
      },
    });
    
    console.log('Meal created successfully:', {
      id: meal.id,
      name: meal.name,
      imagesCount: meal.images?.length || 0,
      authorId: meal.authorId
    });

    console.log('Returning successful response');
    console.log('=== MEAL CREATION SUCCESS ===');
    return NextResponse.json(
      { success: true, data: meal }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('=== MEAL CREATION ERROR ===');
    console.error('Error creating meal:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    });
    console.error('=== END MEAL CREATION ERROR ===');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create meal',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}