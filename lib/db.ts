/**
 * Database connection and Prisma client setup
 * 
 * This file configures the Prisma client for database operations.
 * It implements a singleton pattern to prevent multiple instances
 * in development (due to hot reloading).
 */

 import { PrismaClient } from '@prisma/client';

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
 export const prisma = globalForPrisma.prisma ?? new PrismaClient({
   log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
 });
 
 // Store the client globally in development
 if (process.env.NODE_ENV !== 'production') {
   globalForPrisma.prisma = prisma;
 }