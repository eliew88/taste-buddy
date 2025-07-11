'use client';

import { useEffect } from 'react';

export default function AnalyticsTestPage() {
  useEffect(() => {
    // Check if analytics is loaded
    console.log('Analytics Test Page Loaded');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL ENV:', process.env.VERCEL_ENV);
    console.log('Window object:', typeof window !== 'undefined' ? window : 'undefined');
    
    // Check for Vercel Analytics
    if (typeof window !== 'undefined') {
      console.log('Vercel Analytics present:', !!(window as any).va);
      console.log('Window analytics:', (window as any).analytics);
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Analytics Test Page</h1>
      <p>Check the console for analytics information.</p>
      <p>Environment: {process.env.NODE_ENV}</p>
      <button 
        onClick={() => {
          console.log('Button clicked - this should trigger an analytics event');
          // Try to manually track an event
          if (typeof window !== 'undefined' && (window as any).va) {
            (window as any).va('event', { name: 'test-button-click' });
          }
        }}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Analytics Event
      </button>
    </div>
  );
}