import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NotificationType } from '@prisma/client';

/**
 * GET /api/notifications
 * Fetch user's notifications with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id
    };
    
    if (unreadOnly) {
      where.read = false;
    }

    // Fetch notifications with related data
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            }
          },
          relatedRecipe: {
            select: {
              id: true,
              title: true,
            }
          },
          relatedComment: {
            select: {
              id: true,
              content: true,
            }
          },
          relatedCompliment: {
            select: {
              id: true,
              message: true,
              tipAmount: true,
              type: true,
            }
          },
          relatedMeal: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          read: false
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + notifications.length < totalCount
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification (internal API for server-side use)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // This endpoint is for internal use only
    // In production, you might want to add API key authentication
    // or restrict this to server-side calls only
    
    const body = await request.json();
    const {
      type,
      title,
      message,
      userId,
      fromUserId,
      relatedRecipeId,
      relatedCommentId,
      relatedComplimentId,
      relatedUserId,
      relatedMealId
    } = body;

    // Validate required fields
    if (!type || !title || !message || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, message, userId' },
        { status: 400 }
      );
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Check if recipient exists and has notifications enabled for this type
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        notifyOnNewFollower: true,
        notifyOnRecipeComment: true,
        notifyOnCompliment: true,
        notifyOnNewRecipeFromFollowing: true,
        notifyOnMealTag: true,
      }
    });

    if (!recipient) {
      return NextResponse.json(
        { success: false, error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Check if user has this notification type enabled
    const notificationEnabled = getNotificationEnabledStatus(type, recipient);
    if (!notificationEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Notification not sent - user has disabled this notification type'
      });
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId,
        fromUserId,
        relatedRecipeId,
        relatedCommentId,
        relatedComplimentId,
        relatedUserId,
        relatedMealId,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if user has a specific notification type enabled
 */
function getNotificationEnabledStatus(
  type: NotificationType,
  user: {
    notifyOnNewFollower: boolean;
    notifyOnRecipeComment: boolean;
    notifyOnCompliment: boolean;
    notifyOnNewRecipeFromFollowing: boolean;
    notifyOnMealTag: boolean;
  }
): boolean {
  switch (type) {
    case NotificationType.NEW_FOLLOWER:
      return user.notifyOnNewFollower;
    case NotificationType.RECIPE_COMMENT:
      return user.notifyOnRecipeComment;
    case NotificationType.COMPLIMENT_RECEIVED:
      return user.notifyOnCompliment;
    case NotificationType.NEW_RECIPE_FROM_FOLLOWING:
      return user.notifyOnNewRecipeFromFollowing;
    case NotificationType.MEAL_TAG:
      return user.notifyOnMealTag;
    default:
      return false;
  }
}