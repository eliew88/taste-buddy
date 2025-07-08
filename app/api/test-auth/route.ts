/**
 * Auth Test API Route
 * 
 * Test authentication without going through NextAuth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('[AUTH TEST] Testing auth for email:', email);
    
    // Check database connection
    try {
      const userCount = await prisma.user.count();
      console.log('[AUTH TEST] Database connected, user count:', userCount);
    } catch (dbError) {
      console.error('[AUTH TEST] Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('[AUTH TEST] User not found');
      return NextResponse.json({
        success: false,
        error: 'User not found',
        availableUsers: await prisma.user.findMany({
          select: { email: true, id: true },
          take: 5
        })
      });
    }
    
    console.log('[AUTH TEST] User found:', { id: user.id, email: user.email, hasPassword: !!user.password });
    
    // Check password
    let isValid = false;
    if (user.password) {
      isValid = await bcrypt.compare(password, user.password);
      console.log('[AUTH TEST] Password hash comparison:', isValid);
    } else {
      isValid = password === 'demo';
      console.log('[AUTH TEST] Demo password check:', isValid);
    }
    
    return NextResponse.json({
      success: true,
      authenticated: isValid,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.password
      }
    });
    
  } catch (error) {
    console.error('[AUTH TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}