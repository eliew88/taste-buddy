'use client';

import { useEffect } from 'react';

export default function AnalyticsTestPage() {
  useEffect(() => {
    // Check if analytics is loaded
    console.log('=== ANALYTICS DIAGNOSTICS ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('NEXT_PUBLIC_VERCEL_ENV:', process.env.NEXT_PUBLIC_VERCEL_ENV);
    console.log('Window location:', typeof window !== 'undefined' ? window.location.href : 'undefined');
    console.log('User agent:', typeof window !== 'undefined' ? navigator.userAgent : 'undefined');
    
    // Check for Vercel Analytics
    if (typeof window !== 'undefined') {
      console.log('Vercel Analytics (window.va):', !!(window as any).va);
      console.log('Analytics object:', (window as any).analytics);
      console.log('All window keys containing "analytic":', Object.keys(window).filter(key => key.toLowerCase().includes('analytic')));
      console.log('All window keys containing "vercel":', Object.keys(window).filter(key => key.toLowerCase().includes('vercel')));
      
      // Check for any analytics-related scripts
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).filter(src => src.includes('analytics') || src.includes('vercel'));
      console.log('Analytics scripts found:', scripts);
    }
    
    // Check after a delay in case it loads asynchronously
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        console.log('=== DELAYED CHECK ===');
        console.log('Vercel Analytics after delay:', !!(window as any).va);
        console.log('Window keys after delay:', Object.keys(window).filter(key => key.toLowerCase().includes('analytic')));
      }
    }, 3000);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Analytics Test Page</h1>
      <p>Check the console for analytics information.</p>
      <p>Environment: {process.env.NODE_ENV}</p>
      <p>URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
      <button 
        onClick={() => {
          console.log('Button clicked - this should trigger an analytics event');
          // Try to manually track an event
          if (typeof window !== 'undefined' && (window as any).va) {
            (window as any).va('event', { name: 'test-button-click' });
            console.log('Analytics event sent via window.va');
          } else {
            console.log('window.va not available');
          }
        }}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Analytics Event
      </button>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Potential Issues to Check:</h3>
        <ul className="list-disc list-inside mt-2 text-sm">
          <li>Ad blockers blocking analytics scripts</li>
          <li>Browser privacy settings</li>
          <li>Domain not matching Vercel project domain</li>
          <li>Analytics not fully enabled for this specific domain</li>
        </ul>
      </div>
    </div>
  );
}