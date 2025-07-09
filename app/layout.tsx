/**
 * Root Layout Component with Error Boundary
 * 
 * The root layout component that wraps the entire application.
 * Now includes error boundary protection with internal error handling.
 * 
 * Location: app/layout.tsx
 * 
 * Features:
 * - Global error boundary protection
 * - Consistent font loading
 * - Meta tags for SEO
 * - Global CSS imports
 */

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ErrorBoundary from '@/components/error-boundary';
import AuthSessionProvider from '@/components/providers/session-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TasteBuddy - Share Your Culinary Masterpieces',
  description: 'Your personal recipe companion. Discover, cook, and share amazing recipes with food lovers worldwide.',
  keywords: ['recipes', 'cooking', 'food', 'meal planning', 'ingredients'],
  authors: [{ name: 'TasteBuddy Team' }],
  creator: 'TasteBuddy',
  publisher: 'TasteBuddy',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tastebuddy.com',
    title: 'TasteBuddy - Share Your Culinary Masterpieces',
    description: 'Your personal recipe companion. Discover, cook, and share amazing recipes with food lovers worldwide.',
    siteName: 'TasteBuddy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TasteBuddy - Share Your Culinary Masterpieces',
    description: 'Your personal recipe companion. Discover, cook, and share amazing recipes with food lovers worldwide.',
  },
};

/**
 * Root Layout Component
 * 
 * Provides the basic HTML structure and global providers for the entire application.
 * Wraps all pages with error boundary protection and consistent styling.
 * 
 * @param children - The page content to render
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#2563eb" />
        
        {/* Viewport for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.className} bg-blue-100`}>
        {/* Global Error Boundary - No function props passed */}
        <ErrorBoundary>
          {/* Session Provider for Authentication */}
          <AuthSessionProvider>
            {/* Main Application Content */}
            <main id="main-content">
              {children}
            </main>
          </AuthSessionProvider>
        </ErrorBoundary>

        {/* Global Scripts */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Analytics scripts would go here */}
            {/* Error monitoring scripts would go here */}
          </>
        )}
      </body>
    </html>
  );
}