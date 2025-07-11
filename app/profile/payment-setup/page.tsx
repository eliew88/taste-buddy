'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import PaymentSetup from '@/components/payment/payment-setup';
import { useFeatureFlag } from '@/lib/feature-flags';

function PaymentSetupContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const paymentsEnabled = useFeatureFlag('enablePayments');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            href="/profile"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Profile
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Setup</h1>
          <p className="text-gray-600">
            Manage your payment settings and start receiving tips from appreciative food lovers.
          </p>
        </div>

        {/* Feature Flag Check */}
        {!paymentsEnabled ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <Lock className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-yellow-800 font-semibold">Payment Processing Disabled</h3>
                <p className="text-yellow-700 mt-1">
                  Payment processing and tipping functionality is currently disabled. 
                  You can still receive compliment messages from other users.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Success Message */}
            {success === 'true' && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-green-800">
                    Payment setup completed successfully! You can now receive tips.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Setup Component */}
            <PaymentSetup />
          </>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">How Tips Work</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Users can send you tips when they love your recipes</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Tips are processed securely through Stripe</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>You'll receive 95% of each tip (5% platform fee)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Payments are deposited directly to your bank account</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <PaymentSetupContent />
    </Suspense>
  );
}