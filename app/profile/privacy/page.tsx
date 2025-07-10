/**
 * Privacy Settings Page
 * 
 * Allows users to manage their privacy preferences
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '@/components/ui/Navigation';
import PrivacySettings from '@/components/privacy/privacy-settings';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Page Header */}
      <div className="bg-blue-100 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/profile"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Profile
            </Link>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage who can see your personal information
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Privacy Settings */}
          <div className="lg:col-span-2">
            <PrivacySettings />
          </div>

          {/* Privacy Information Sidebar */}
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About Privacy Settings</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>Hidden:</strong> Your email will not be visible to anyone except yourself.
                </p>
                <p>
                  <strong>People I Follow:</strong> Only users that you follow can see your email address.
                </p>
                <p>
                  <strong>Everyone:</strong> Anyone who visits your profile can see your email address.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Privacy Tip</h4>
              <p className="text-sm text-yellow-700">
                We recommend keeping your email hidden or limited to people you follow to protect your privacy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}