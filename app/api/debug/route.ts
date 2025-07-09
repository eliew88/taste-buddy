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
    // B2 Configuration status
    b2Status: {
      configured: !!(process.env.B2_ENDPOINT && process.env.B2_ACCESS_KEY_ID && process.env.B2_SECRET_ACCESS_KEY && process.env.B2_BUCKET_NAME && process.env.B2_PUBLIC_URL),
      endpoint: process.env.B2_ENDPOINT ? 'Set' : 'Missing',
      region: process.env.B2_REGION ? 'Set' : 'Missing',
      accessKeyId: process.env.B2_ACCESS_KEY_ID ? 'Set' : 'Missing',
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
      bucketName: process.env.B2_BUCKET_NAME ? 'Set' : 'Missing',
      publicUrl: process.env.B2_PUBLIC_URL ? 'Set' : 'Missing',
      // Show partial values for debugging (but not full secrets)
      endpointValue: process.env.B2_ENDPOINT,
      regionValue: process.env.B2_REGION,
      bucketNameValue: process.env.B2_BUCKET_NAME,
      publicUrlValue: process.env.B2_PUBLIC_URL,
    },
    errors: [] as string[],
    userCount: 0,
    demoUsers: [] as Array<{ email: string; id: string; hasPassword: boolean; passwordLength: number }>,
    demoPasswordTest: {} as Record<string, unknown>,
    canCreateUsers: false,
    databaseConnected: true,
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
      select: { email: true, id: true, password: true }
    });
    debug.demoUsers = demoUsers.map(user => ({
      email: user.email,
      id: user.id,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0
    }));
    
    // Test a sample demo user password
    if (demoUsers.length > 0) {
      const sampleUser = demoUsers[0];
      if (sampleUser.password) {
        const bcrypt = require('bcryptjs');
        const isDemoPasswordValid = await bcrypt.compare('demo', sampleUser.password);
        debug.demoPasswordTest = {
          email: sampleUser.email,
          passwordHashExists: true,
          demoPasswordValid: isDemoPasswordValid
        };
      } else {
        debug.demoPasswordTest = {
          email: sampleUser.email,
          passwordHashExists: false,
          note: 'No password hash - should accept "demo" as password'
        };
      }
    }
    
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