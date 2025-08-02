// app/api/meals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { evaluateMealAchievements, evaluatePhotoAchievements } from '@/lib/achievement-service';
import { createMealTagNotification } from '@/lib/notification-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const mealType = searchParams.get('mealType') as 'created' | 'tagged' | 'all' || 'all';
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

    // Build where clause based on meal type filter
    let where: Record<string, unknown>;
    
    if (mealType === 'created') {
      // Show only meals created by the user
      where = {
        authorId: userId
      };
    } else if (mealType === 'tagged') {
      // Show only public meals where user is tagged (excluding their own)
      where = {
        AND: [
          { isPublic: true },
          { authorId: { not: userId } }, // Exclude user's own meals
          {
            taggedUsers: {
              some: {
                userId: userId
              }
            }
          }
        ]
      };
    } else {
      // Show all meals (default behavior) - authored meals and public tagged meals
      where = {
        OR: [
          { authorId: userId }, // All meals the user created (public and private)
          { 
            AND: [
              { isPublic: true }, // Only public meals where user is tagged
              {
                taggedUsers: {
                  some: {
                    userId: userId
                  }
                }
              }
            ]
          }
        ]
      };
    }

    // Search functionality (PostgreSQL with case-insensitive search)
    if (search) {
      const searchCondition = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      };

      if (where.AND) {
        // If where already has AND condition, combine them
        where.AND = Array.isArray(where.AND) 
          ? [...where.AND, searchCondition]
          : [where.AND, searchCondition];
      } else if (where.OR) {
        // If where has OR condition, wrap it in AND with search
        where = {
          AND: [
            { OR: where.OR },
            searchCondition
          ]
        };
      } else {
        // Simple case, just add search to existing condition
        where.AND = searchCondition;
      }
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
      isPublic = true, // Default to public if not specified
      images,
      taggedUserIds
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
    
    // Validate tagged users are TasteBuddies
    let validTaggedUserIds: string[] = [];
    if (Array.isArray(taggedUserIds) && taggedUserIds.length > 0) {
      console.log('Validating tagged users...');
      
      // Get mutual follows (TasteBuddies)
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });
      
      const followingIds = following.map(f => f.followingId);
      
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
      
      const tastebuddyIds = new Set(tastebuddies.map(tb => tb.id));
      
      // Filter only valid TasteBuddies
      validTaggedUserIds = taggedUserIds.filter(id => tastebuddyIds.has(id));
      console.log(`Valid tagged users: ${validTaggedUserIds.length} of ${taggedUserIds.length}`);
    }

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
    
    // Prepare tags data if provided
    let tagsData = undefined;
    if (validTaggedUserIds.length > 0) {
      tagsData = {
        create: validTaggedUserIds.map(taggedUserId => ({
          userId: taggedUserId,
          taggedBy: userId // The meal author is the one tagging
        }))
      };
    }
    
    const mealData = {
      name: name.trim(),
      description: description?.trim() || null,
      date: date ? new Date(date) : null,
      isPublic: isPublic,
      authorId: userId,
      ...(imagesData && { images: imagesData }),
      ...(tagsData && { taggedUsers: tagsData })
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
        taggedUsers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      },
    });
    
    console.log('Meal created successfully:', {
      id: meal.id,
      name: meal.name,
      imagesCount: meal.images?.length || 0,
      authorId: meal.authorId
    });

    // Send notifications to tagged users
    if (validTaggedUserIds.length > 0) {
      try {
        console.log('Sending meal tag notifications...');
        const authorName = meal.author.name || 'Someone';
        
        // Create notifications for all tagged users in parallel
        const notificationPromises = validTaggedUserIds.map(taggedUserId =>
          createMealTagNotification(
            userId, // taggerId (meal author)
            taggedUserId, // taggedUserId
            meal.id, // mealId
            meal.name, // mealName
            authorName // taggerName
          )
        );
        
        const notificationResults = await Promise.allSettled(notificationPromises);
        const successfulNotifications = notificationResults.filter(
          result => result.status === 'fulfilled' && result.value.success
        ).length;
        
        console.log(`Sent ${successfulNotifications}/${validTaggedUserIds.length} meal tag notifications`);
      } catch (error) {
        console.error('Error sending meal tag notifications:', error);
        // Don't fail the meal creation if notifications fail
      }
    }

    // Evaluate achievements for the meal author
    let allNewAchievements: any[] = [];
    try {
      console.log('Evaluating achievements for meal creation...');
      const achievementResults = [];
      
      // Check meal count achievements
      const mealAchievements = await evaluateMealAchievements(meal.authorId);
      achievementResults.push(mealAchievements);
      
      // Check photo achievements if images were uploaded
      if (meal.images && meal.images.length > 0) {
        const photoAchievements = await evaluatePhotoAchievements(meal.authorId);
        achievementResults.push(photoAchievements);
      }
      
      // Collect all new achievements
      achievementResults.forEach(result => {
        if (result.newAchievements.length > 0) {
          console.log(`User ${meal.authorId} earned achievements:`, 
            result.newAchievements.map(a => a.achievement.name));
          allNewAchievements.push(...result.newAchievements);
        }
      });
      
    } catch (error) {
      console.error('Failed to evaluate achievements:', error);
      // Don't fail the meal creation if achievement evaluation fails
    }

    console.log('Returning successful response');
    console.log('=== MEAL CREATION SUCCESS ===');
    return NextResponse.json(
      { 
        success: true, 
        data: meal,
        newAchievements: allNewAchievements // Include achievements in response
      }, 
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