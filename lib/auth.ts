/**
 * Authentication utilities and configuration
 * 
 * Provides helper functions for authentication throughout the app.
 */

import { getServerSession } from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Check if database is properly configured
          if (!env.DATABASE_URL || 
              env.DATABASE_URL === 'file:./dev.db' || 
              env.DATABASE_URL.includes('placeholder') ||
              (!env.DATABASE_URL.startsWith('postgresql://') && !env.DATABASE_URL.startsWith('postgres://'))) {
            console.warn('Database not properly configured for auth, URL:', env.DATABASE_URL?.split('://')[0]);
            return null;
          }
          
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user) {
            return null;
          }

          // Handle authentication - support both demo and regular users
          let isPasswordValid = false;

          if (user.password) {
            // User has a hashed password - verify it
            isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            );
          } else {
            // Demo user fallback - allow 'demo' password for users without stored password
            isPasswordValid = credentials.password === 'demo';
          }

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  // Production security settings
  secret: env.NEXTAUTH_SECRET,
  useSecureCookies: env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: env.NODE_ENV === 'production'
      }
    },
  },
};

/**
 * Get the current user session on the server side
 */
export function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getAuthSession();
  return session?.user?.id || null;
}