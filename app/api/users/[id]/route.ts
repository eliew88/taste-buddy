import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserWithPrivacy } from '@/lib/privacy-utils';

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

    // Get user data with privacy settings applied
    const user = await getUserWithPrivacy(userId, session.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    // Check if user can edit this profile (only own profile)
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only edit your own profile' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { instagramUrl, websiteUrl, bio } = body;

    // Validate URLs if provided
    const urlRegex = /^https?:\/\/.+/;
    if (instagramUrl && !urlRegex.test(instagramUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Instagram URL format' },
        { status: 400 }
      );
    }
    
    if (websiteUrl && !urlRegex.test(websiteUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid website URL format' },
        { status: 400 }
      );
    }

    // Validate bio length if provided
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        instagramUrl: instagramUrl || null,
        websiteUrl: websiteUrl || null,
        bio: bio || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        createdAt: true,
        instagramUrl: true,
        websiteUrl: true,
        paymentAccount: {
          select: {
            accountStatus: true,
            onboardingComplete: true,
            payoutsEnabled: true,
            acceptsTips: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}