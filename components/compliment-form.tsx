/**
 * Compliment Form Component
 * 
 * Modal form that allows users to send compliments to chefs with message or tip options
 * 
 * Features:
 * - Modal overlay with backdrop
 * - Message/tip type selection
 * - Textarea for compliment message
 * - Tip amount input (for future payment processing)
 * - Anonymous option
 * - Form validation and submission
 * - Loading states and error handling
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useFeatureFlag } from '@/lib/feature-flags';
import { 
  X, 
  Heart, 
  DollarSign, 
  Send,
  AlertCircle,
  UserCheck,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface ComplimentFormProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** ID of the user receiving the compliment */
  toUserId: string;
  /** Name of the user receiving the compliment */
  toUserName: string;
  /** Optional: Recipe that inspired the compliment */
  recipe?: {
    id: string;
    title: string;
  };
  /** Callback when compliment is successfully sent */
  onComplimentSent?: () => void;
}

export default function ComplimentForm({ 
  isOpen, 
  onClose, 
  toUserId, 
  toUserName, 
  recipe,
  onComplimentSent 
}: ComplimentFormProps) {
  const { data: session } = useSession();
  const paymentsEnabled = useFeatureFlag('enablePayments');
  const [type, setType] = useState<'message' | 'tip'>('message');
  const [message, setMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{
    canSendTips: boolean;
    canReceiveTips: boolean;
    loading: boolean;
  }>({ canSendTips: false, canReceiveTips: false, loading: true });

  // Check payment status when modal opens (only if payments are enabled)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (isOpen && session?.user?.id && paymentsEnabled) {
        try {
          // Check sender's payment status
          const senderResponse = await fetch('/api/payment/status');
          const senderData = await senderResponse.json();
          
          // Check recipient's payment status
          const recipientResponse = await fetch(`/api/users/${toUserId}`);
          const recipientData = await recipientResponse.json();
          
          const senderCanTip = senderData.success && senderData.data?.canSendTips;
          const recipientCanReceive = recipientData.success && 
                                    recipientData.data?.paymentAccount &&
                                    recipientData.data.paymentAccount.acceptsTips && 
                                    recipientData.data.paymentAccount.accountStatus === 'active';
          
          console.log('Payment status check:', {
            senderCanTip,
            recipientCanReceive,
            senderData: senderData.data,
            recipientPaymentAccount: recipientData.data?.paymentAccount
          });
          
          setPaymentStatus({
            canSendTips: senderCanTip,
            canReceiveTips: recipientCanReceive,
            loading: false
          });
        } catch (err) {
          console.error('Failed to check payment status:', err);
          setPaymentStatus({ canSendTips: false, canReceiveTips: false, loading: false });
        }
      } else {
        // If payments are disabled, set payment status to false
        setPaymentStatus({ canSendTips: false, canReceiveTips: false, loading: false });
      }
    };
    
    checkPaymentStatus();
  }, [isOpen, session?.user?.id, toUserId, paymentsEnabled]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setType('message');
      setMessage('');
      setTipAmount('');
      setIsAnonymous(false);
      setError(null);
    }
  }, [isOpen]);

  // Don't render if not authenticated
  if (!session?.user?.id) {
    return null;
  }

  // Don't render if modal is closed
  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (type === 'tip' && (!tipAmount || parseFloat(tipAmount) < 0.50)) {
      setError('Tip amount must be at least $0.50');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const requestBody = {
        type,
        message: message.trim(),
        toUserId,
        recipeId: recipe?.id,
        isAnonymous,
        ...(type === 'tip' && { tipAmount: parseFloat(tipAmount) })
      };

      const response = await fetch('/api/compliments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        onComplimentSent?.();
        onClose();
      } else {
        setError(data.error || 'Failed to send compliment');
      }
    } catch (err) {
      setError('Failed to send compliment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={handleBackdropClick}
      >
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center">
              <Heart className="w-6 h-6 text-pink-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Compliment the Chef
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Recipient Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <UserCheck className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm text-green-800">
                    Sending private compliment to <strong>{toUserName}</strong>
                  </p>
                  {recipe && (
                    <p className="text-sm text-green-600 mt-1">
                      About: {recipe.title}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Compliment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Compliment Type
              </label>
              <div className={`grid ${paymentStatus.canSendTips && paymentStatus.canReceiveTips ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                <button
                  type="button"
                  onClick={() => setType('message')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    type === 'message'
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Heart className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Send Message</div>
                  <div className="text-xs text-gray-500">Share your appreciation</div>
                </button>
                
                {paymentStatus.canSendTips && paymentStatus.canReceiveTips && (
                  <button
                    type="button"
                    onClick={() => setType('tip')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      type === 'tip'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Send Tip</div>
                    <div className="text-xs text-gray-500">Show appreciation with a tip</div>
                  </button>
                )}
              </div>
              
              {/* Info message when tips are not available */}
              {!paymentStatus.loading && (!paymentStatus.canSendTips || !paymentStatus.canReceiveTips) && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    {!paymentsEnabled 
                      ? 'Tipping is currently disabled.'
                      : !paymentStatus.canSendTips && !paymentStatus.canReceiveTips 
                      ? 'You must both have payment accounts set up to send tips.'
                      : !paymentStatus.canReceiveTips 
                      ? `${toUserName} hasn't set up their payment account yet, so tips are not available.`
                      : !paymentStatus.canSendTips
                      ? 'You need to set up your payment account to send tips.'
                      : 'Tips are currently unavailable.'}
                  </p>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-600 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                rows={4}
                placeholder={
                  type === 'message' 
                    ? `Tell ${toUserName} what you loved about their recipe...`
                    : `Include a message with your tip...`
                }
                disabled={isSubmitting}
                maxLength={500}
              />
              <div className="mt-1 text-xs text-gray-500 text-right">
                {message.length}/500 characters
              </div>
            </div>

            {/* Tip Amount (for tip type) */}
            {type === 'tip' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Sparkles className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Tip Amount
                  </span>
                </div>
                
                {/* Preset Amounts */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[5, 10, 20].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTipAmount(preset.toString())}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        tipAmount === preset.toString()
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-green-700 hover:bg-green-100 border border-green-300'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.50"
                    min="0.50"
                    max="100"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Custom amount (min $0.50)"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Minimum tip amount is $0.50. Maximum is $100.00.
                </p>
              </div>
            )}

            {/* Anonymous Option */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                  <EyeOff className="w-4 h-4 mr-1" />
                  Send anonymously
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Your name will be hidden from the recipient
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim() || (type === 'tip' && (!tipAmount || parseFloat(tipAmount) < 0.50))}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  isSubmitting || !message.trim() || (type === 'tip' && (!tipAmount || parseFloat(tipAmount) < 0.50))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Sending...' : `Send ${type === 'tip' ? 'Tip' : 'Compliment'}`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}