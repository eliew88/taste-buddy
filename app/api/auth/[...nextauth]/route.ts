/**
 * NextAuth.js API Route Handler
 * 
 * Handles authentication requests for TasteBuddy using NextAuth.js v4.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };