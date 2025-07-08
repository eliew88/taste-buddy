/**
 * Database connection and Prisma client setup
 * 
 * This file configures the Prisma client for PostgreSQL database operations.
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
  // Require a valid PostgreSQL database URL
  const dbUrl = env.DATABASE_URL;
  
  if (!dbUrl || !dbUrl.includes('postgres')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  console.log('Creating Prisma client with PostgreSQL connection');
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: dbUrl,
  });
})();

// Store the client globally in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}