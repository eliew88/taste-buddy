'use client';

import { useEffect } from 'react';
import { inject } from '@vercel/analytics';

export function AnalyticsProvider() {
  useEffect(() => {
    // Inject analytics when component mounts
    inject({
      mode: 'production',
      debug: true,
    });
    
    console.log('Analytics injected');
  }, []);

  return null;
}