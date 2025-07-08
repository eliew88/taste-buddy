/**
 * Database connection and Prisma client setup
 * 
 * This file configures the Prisma client for database operations.
 * It implements a singleton pattern to prevent multiple instances
 * in development (due to hot reloading).
 */

 import { PrismaClient } from '@prisma/client';
 import { env } from '@/lib/env';

 /**
  * Global variable to store Prisma client in development
  * This prevents creating multiple instances during hot reloads
  */
 const globalForPrisma = globalThis as unknown as {
   prisma: PrismaClient | undefined;
 };
 
 /**
  * Prisma client instance
  * - In production: creates a new instance
  * - In development: reuses existing instance to prevent connection issues
  */
 export const prisma = globalForPrisma.prisma ?? (() => {
   // Check if we have a valid database URL
   const dbUrl = env.DATABASE_URL;
   
   if (!dbUrl || dbUrl.includes('placeholder')) {
     console.warn('Invalid or missing DATABASE_URL, using mock client');
     // Return a mock client that won't crash
     // Return a comprehensive mock client that won't crash
     const mockModel = {
       findUnique: async () => null,
       findMany: async () => [],
       create: async () => { throw new Error('Database not configured'); },
       update: async () => { throw new Error('Database not configured'); },
       delete: async () => { throw new Error('Database not configured'); },
       count: async () => 0,
       findFirst: async () => null,
       upsert: async () => { throw new Error('Database not configured'); },
     };
     
     return {
       user: mockModel,
       recipe: { ...mockModel, count: async () => 0 },
       favorite: mockModel,
       rating: mockModel,
       $disconnect: async () => {},
       $connect: async () => {},
       $transaction: async () => { throw new Error('Database not configured'); },
     } as unknown as PrismaClient;
   }
   
   try {
     console.log('Creating Prisma client with URL protocol:', dbUrl.split('://')[0]);
     return new PrismaClient({
       log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
       datasourceUrl: dbUrl,
     });
   } catch (error) {
     console.error('Prisma client creation failed:', error);
     throw error;
   }
 })();
 
 // Store the client globally in development
 if (process.env.NODE_ENV !== 'production') {
   globalForPrisma.prisma = prisma;
 }