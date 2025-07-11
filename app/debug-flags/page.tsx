'use client';

import { useFeatureFlag, featureFlags } from '@/lib/feature-flags';

export default function DebugFlagsPage() {
  const paymentsEnabled = useFeatureFlag('enablePayments');
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Feature Flags Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Environment Variables (Client Side)</h2>
          <pre className="text-xs mt-2">
            {JSON.stringify({
              NEXT_PUBLIC_FEATURE_ENABLEPAYMENTS: process.env.NEXT_PUBLIC_FEATURE_ENABLEPAYMENTS,
              NODE_ENV: process.env.NODE_ENV,
              VERCEL_ENV: process.env.VERCEL_ENV
            }, null, 2)}
          </pre>
        </div>
        
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-bold">Feature Flags (Computed)</h2>
          <pre className="text-xs mt-2">
            {JSON.stringify(featureFlags, null, 2)}
          </pre>
        </div>
        
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-bold">Hook Results</h2>
          <p>paymentsEnabled from hook: {paymentsEnabled.toString()}</p>
        </div>
      </div>
    </div>
  );
}