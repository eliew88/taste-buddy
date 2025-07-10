import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/users/notification-preferences
 * Get current user's notification preferences
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        notifyOnNewFollower: true,
        notifyOnRecipeComment: true,
        notifyOnCompliment: true,
        notifyOnNewRecipeFromFollowing: true,
        emailNotifications: true,
        emailDigest: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        notifyOnNewFollower: user.notifyOnNewFollower,
        notifyOnRecipeComment: user.notifyOnRecipeComment,
        notifyOnCompliment: user.notifyOnCompliment,
        notifyOnNewRecipeFromFollowing: user.notifyOnNewRecipeFromFollowing,
        emailNotifications: user.emailNotifications,
        emailDigest: user.emailDigest,
      }
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/notification-preferences
 * Update current user's notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      notifyOnNewFollower,
      notifyOnRecipeComment,
      notifyOnCompliment,
      notifyOnNewRecipeFromFollowing,
      emailNotifications,
      emailDigest,
    } = body;

    // Validate that all values are booleans if provided
    const booleanFields = {
      notifyOnNewFollower,
      notifyOnRecipeComment,
      notifyOnCompliment,
      notifyOnNewRecipeFromFollowing,
      emailNotifications,
      emailDigest,
    };

    const updateData: any = {};
    
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined) {
        if (typeof value !== 'boolean') {
          return NextResponse.json(
            { success: false, error: `${key} must be a boolean value` },
            { status: 400 }
          );
        }
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid preferences provided' },
        { status: 400 }
      );
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        notifyOnNewFollower: true,
        notifyOnRecipeComment: true,
        notifyOnCompliment: true,
        notifyOnNewRecipeFromFollowing: true,
        emailNotifications: true,
        emailDigest: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notifyOnNewFollower: updatedUser.notifyOnNewFollower,
        notifyOnRecipeComment: updatedUser.notifyOnRecipeComment,
        notifyOnCompliment: updatedUser.notifyOnCompliment,
        notifyOnNewRecipeFromFollowing: updatedUser.notifyOnNewRecipeFromFollowing,
        emailNotifications: updatedUser.emailNotifications,
        emailDigest: updatedUser.emailDigest,
      }
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}