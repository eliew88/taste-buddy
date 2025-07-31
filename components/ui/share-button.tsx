'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, Share } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
}

export default function ShareButton({ title, text, url, className = '' }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setShowMenu(false);
        }, 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleNativeShare = async () => {
    const shareData = {
      title,
      text,
      url,
    };

    try {
      await navigator.share(shareData);
      setShowMenu(false);
    } catch (error) {
      // Don't show error if user simply cancelled the share
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the share, which is fine
        return;
      }
      // Only log actual errors
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        title="Share"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-300 py-2 z-50">
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-3 text-left hover:bg-gray-100 active:bg-gray-200 flex items-center space-x-3 transition-colors touch-manipulation"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-700" />
                <span className="text-gray-900 font-medium">Copy Link</span>
              </>
            )}
          </button>
          
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 active:bg-gray-200 flex items-center space-x-3 transition-colors touch-manipulation"
            >
              <Share className="w-4 h-4 text-gray-700" />
              <span className="text-gray-900 font-medium">Share...</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}