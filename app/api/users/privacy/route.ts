/**
 * User Privacy Settings API
 * 
 * Handles updating user privacy preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EmailVisibility } from '@/types/privacy';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        emailVisibility: true,
      },
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
        emailVisibility: user.emailVisibility,
      },
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { emailVisibility } = body;

    // Validate email visibility value
    const validVisibilityValues: EmailVisibility[] = ['HIDDEN', 'FOLLOWING_ONLY', 'PUBLIC'];
    if (!emailVisibility || !validVisibilityValues.includes(emailVisibility)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email visibility setting' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailVisibility,
      },
      select: {
        id: true,
        emailVisibility: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        emailVisibility: updatedUser.emailVisibility,
      },
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}