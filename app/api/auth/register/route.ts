/**
 * User Registration API Route
 * 
 * Handles new user account creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  console.log('[Registration] Starting registration process');
  
  try {
    const body = await request.json();
    console.log('[Registration] Request body received:', { email: body.email, hasName: !!body.name, hasPassword: !!body.password });
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      console.log('[Registration] Validation failed:', validation.error.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.errors[0].message 
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;
    console.log('[Registration] Validation passed for email:', email);

    // Check if user already exists
    console.log('[Registration] Checking for existing user');
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    console.log('[Registration] Existing user check complete:', { exists: !!existingUser });

    if (existingUser) {
      console.log('[Registration] User already exists');
      return NextResponse.json(
        { 
          success: false, 
          error: 'An account with this email already exists' 
        },
        { status: 400 }
      );
    }

    // Hash password
    console.log('[Registration] Hashing password');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('[Registration] Password hashed successfully');

    // Create user
    console.log('[Registration] Creating user in database');
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    });
    console.log('[Registration] User created successfully:', { id: user.id, email: user.email });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[Registration] Error occurred:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create account. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    );
  }
}