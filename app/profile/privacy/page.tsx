/**
 * Privacy Settings Page
 * 
 * Allows users to manage their privacy preferences
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from '@/components/ui/Navigation';
import PrivacySettings from '@/components/privacy/privacy-settings';
import { NotificationSettings } from '@/components/notifications/notification-settings';
import { ArrowLeft, Settings, Bell } from 'lucide-react';
import Link from 'next/link';

export default function PrivacySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'privacy' | 'notifications'>('privacy');

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
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your privacy preferences and notification settings
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Content */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'privacy'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Privacy Settings</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'privacy' ? (
              <PrivacySettings />
            ) : (
              <NotificationSettings />
            )}
          </div>

          {/* Information Sidebar */}
          <div className="space-y-6">
            {activeTab === 'privacy' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="bg-green-50 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About Notifications</h3>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>
                      <strong>In-App:</strong> Notifications appear in your notification bell and can be accessed anytime.
                    </p>
                    <p>
                      <strong>Email:</strong> Optional email notifications are sent to your registered email address.
                    </p>
                    <p>
                      <strong>Instant:</strong> Most notifications are sent immediately when activities occur.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Staying Connected</h4>
                  <p className="text-sm text-blue-700">
                    Enable notifications to stay up-to-date with your TasteBuddy community and never miss new recipes from people you follow.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}