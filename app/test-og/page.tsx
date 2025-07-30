'use client';

import { useState } from 'react';

export default function TestOGPage() {
  const [url, setUrl] = useState('');
  const [checking, setChecking] = useState(false);

  const checkOG = () => {
    if (url) {
      // Open Facebook debugger
      window.open(`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Open Graph Testing Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Test Your Share Links</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter a TasteBuddy URL to test:
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:3000/recipes/[id]"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={checkOG}
              disabled={!url}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check with Facebook Debugger
            </button>
          </div>
          
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <p><strong>Test Recipe URLs:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Go to any recipe page</li>
              <li>Click the Share button → Copy Link</li>
              <li>Paste the URL above and click "Check with Facebook Debugger"</li>
            </ul>
            
            <p className="mt-4"><strong>What to look for:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>✓ Recipe title appears as the headline</li>
              <li>✓ Recipe image shows as the thumbnail</li>
              <li>✓ Description includes ingredients</li>
              <li>✓ Site name shows as "TasteBuddy"</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> For local testing, Open Graph tags won't work with localhost URLs. 
            Deploy to production or use a tunneling service like ngrok to test with real URLs.
          </p>
        </div>
      </div>
    </div>
  );
}