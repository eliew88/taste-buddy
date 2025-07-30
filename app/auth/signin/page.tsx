/**
 * Sign In Page
 * 
 * User authentication page with email/password login.
 */

'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Check if we're in production based on the URL
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        // Successful login
        const session = await getSession();
        if (session) {
          router.push('/');
          router.refresh();
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo user login shortcuts
  const handleDemoLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('demo'); // Demo password
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: userEmail,
        password: 'demo',
        redirect: false,
      });

      if (result?.error) {
        setError('Demo login failed');
      } else {
        const session = await getSession();
        if (session) {
          router.push('/');
          router.refresh();
        }
      }
    } catch {
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <Link href="/" className="flex justify-center">
          <div className="flex items-center space-x-2 text-green-700">
            <ChefHat className="w-8 h-8" />
            <span className="text-2xl font-bold">TasteBuddy</span>
          </div>
        </Link>
        
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your TasteBuddy account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Demo Users Section - Only show in development */}
          {!isProduction && (
            <>
              <div className="mb-6 p-4 bg-purple-100 rounded-lg">
                <h3 className="text-sm font-medium text-purple-900 mb-3">Demo Users (Click to Login)</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleDemoLogin('sarah@example.com')}
                    disabled={loading}
                    className="w-full text-left text-sm text-purple-800 hover:text-purple-900 p-2 rounded hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    <strong>Sarah Chen</strong> - Recipe Creator
                  </button>
                  <button
                    onClick={() => handleDemoLogin('mike@example.com')}
                    disabled={loading}
                    className="w-full text-left text-sm text-purple-800 hover:text-purple-900 p-2 rounded hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    <strong>Mike Rodriguez</strong> - Food Enthusiast
                  </button>
                  <button
                    onClick={() => handleDemoLogin('david@example.com')}
                    disabled={loading}
                    className="w-full text-left text-sm text-purple-800 hover:text-purple-900 p-2 rounded hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    <strong>David Kim</strong> - Cooking Expert
                  </button>
                </div>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign in manually</span>
                </div>
              </div>
            </>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-purple-600 focus:border-purple-600"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-purple-600 focus:border-purple-600"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-green-700 hover:text-green-600">
                  Sign up
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}