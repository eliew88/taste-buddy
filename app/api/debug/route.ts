/**
 * Debug API Route
 * 
 * Comprehensive debugging endpoint to diagnose production issues.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    databaseUrlProtocol: process.env.DATABASE_URL?.split('://')[0] || 'UNKNOWN',
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    errors: [] as string[],
  };

  try {
    // Test database connection
    console.log('[Debug] Testing database connection...');
    const userCount = await prisma.user.count();
    debug.userCount = userCount;
    
    // Test if demo users exist
    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['sarah@example.com', 'mike@example.com', 'david@example.com']
        }
      },
      select: { email: true, id: true }
    });
    debug.demoUsers = demoUsers;
    
    // Test user creation (dry run)
    const testEmail = `test-${Date.now()}@example.com`;
    try {
      await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User',
          password: 'test-password-hash'
        }
      });
      
      // Clean up test user
      await prisma.user.delete({ where: { email: testEmail } });
      debug.canCreateUsers = true;
    } catch (createError) {
      debug.canCreateUsers = false;
      debug.errors.push(`User creation failed: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
    }
    
  } catch (dbError) {
    debug.errors.push(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    debug.databaseConnected = false;
  }

  return NextResponse.json(debug);
}

export async function POST() {
  try {
    console.log('[Debug] Manual database setup initiated');
    
    // Push schema
    console.log('[Debug] Schema should be pushed manually via: npx prisma db push');
    
    return NextResponse.json({
      success: true,
      message: 'Run: DATABASE_URL="your-url" npx prisma db push && DATABASE_URL="your-url" npm run db:seed'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}