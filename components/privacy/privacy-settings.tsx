'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Users, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { EmailVisibility, EMAIL_VISIBILITY_OPTIONS } from '@/types/privacy';
import { LoadingButton } from '@/components/ui/loading';

interface PrivacySettingsProps {
  className?: string;
}

export default function PrivacySettings({ className = '' }: PrivacySettingsProps) {
  const [emailVisibility, setEmailVisibility] = useState<EmailVisibility>('HIDDEN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch current privacy settings
  useEffect(() => {
    const fetchPrivacySettings = async () => {
      try {
        const response = await fetch('/api/users/privacy');
        const data = await response.json();
        
        if (data.success) {
          setEmailVisibility(data.data.emailVisibility);
        } else {
          setError(data.error || 'Failed to load privacy settings');
        }
      } catch (err) {
        setError('Failed to load privacy settings');
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacySettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/users/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailVisibility,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000); // Hide success message after 3s
      } else {
        setError(data.error || 'Failed to update privacy settings');
      }
    } catch (err) {
      setError('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const getVisibilityIcon = (visibility: EmailVisibility) => {
    switch (visibility) {
      case 'HIDDEN':
        return <EyeOff className="w-4 h-4" />;
      case 'FOLLOWING_ONLY':
        return <Users className="w-4 h-4" />;
      case 'PUBLIC':
        return <Globe className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-blue-100 rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-100 rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <Shield className="w-6 h-6 text-green-700 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Email Visibility Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Email Visibility</h3>
          <p className="text-sm text-gray-600 mb-4">
            Control who can see your email address on your profile
          </p>

          <div className="space-y-3">
            {EMAIL_VISIBILITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  emailVisibility === option.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="emailVisibility"
                  value={option.value}
                  checked={emailVisibility === option.value}
                  onChange={(e) => setEmailVisibility(e.target.value as EmailVisibility)}
                  className="sr-only"
                />
                <div className="flex items-center flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mr-4">
                    {getVisibilityIcon(option.value)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{option.label}</span>
                      {emailVisibility === option.value && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-800 text-sm">Privacy settings updated successfully!</span>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <LoadingButton
            loading={saving}
            onClick={handleSave}
            className="bg-green-700 text-white hover:bg-green-800 focus:ring-green-500 px-6 py-2"
          >
            Save Privacy Settings
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}