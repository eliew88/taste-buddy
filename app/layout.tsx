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
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ErrorBoundary from '@/components/error-boundary';
import AuthSessionProvider from '@/components/providers/session-provider';
import { AchievementProvider } from '@/components/providers/achievement-provider';

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
        
        {/* Google Fonts - Including a script/decorative font similar to Champagne */}
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/cooking-pot-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/cooking-pot-icon.svg" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#B370B0" />
        
        {/* Viewport for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={`${inter.className}`} style={{ backgroundColor: '#CFE8EF' }}>
        {/* Global Error Boundary - No function props passed */}
        <ErrorBoundary>
          {/* Session Provider for Authentication */}
          <AuthSessionProvider>
            {/* Achievement Provider for Real-time Notifications */}
            <AchievementProvider>
              {/* Main Application Content */}
              <main id="main-content">
                {children}
              </main>
            </AchievementProvider>
          </AuthSessionProvider>
        </ErrorBoundary>
        
        {/* Vercel Analytics & Speed Insights */}
        <Analytics />
        <SpeedInsights />

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