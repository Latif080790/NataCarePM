/**
 * User Feedback Widget Component
 *
 * Priority 2C: Monitoring & Analytics
 *
 * Features:
 * - Collects user feedback on app experience
 * - Reports bugs and issues
 * - Suggests improvements
 * - Integrates with Sentry for error reporting
 * - Tracks satisfaction metrics
 */

import React, { useState } from 'react';
import { MessageSquare, X, ThumbsUp, Bug, Lightbulb, Send } from 'lucide-react';
import { captureSentryMessage, showSentryFeedbackDialog } from '../config/sentry.config';
import { trackEvent } from '../config/ga4.config';

export interface FeedbackData {
  type: 'bug' | 'suggestion' | 'general' | 'satisfaction';
  rating?: number;
  message: string;
  email?: string;
  screenshot?: string;
  url: string;
  timestamp: number;
  userAgent: string;
}

export interface UserFeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showInitialDelay?: number;
  collectEmail?: boolean;
  allowScreenshot?: boolean;
}

/**
 * Main User Feedback Widget Component
 */
export const UserFeedbackWidget: React.FC<UserFeedbackWidgetProps> = ({
  position = 'bottom-right',
  showInitialDelay = 3000,
  collectEmail = true,
  allowScreenshot = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<
    'bug' | 'suggestion' | 'general' | 'satisfaction' | null
  >(null);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Show widget after initial delay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showInitialDelay);

    return () => clearTimeout(timer);
  }, [showInitialDelay]);

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const handleOpen = () => {
    setIsOpen(true);
    trackEvent('Feedback', 'Widget Opened');
  };

  const handleClose = () => {
    setIsOpen(false);
    setFeedbackType(null);
    setRating(null);
    setMessage('');
    setEmail('');
    setSubmitted(false);
    trackEvent('Feedback', 'Widget Closed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackType || !message.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        rating: rating || undefined,
        message: message.trim(),
        email: email.trim() || undefined,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      };

      // Send to Sentry
      captureSentryMessage(`User Feedback: ${feedbackType}`, 'info', {
        feedback: feedbackData,
      });

      // Track in GA4
      trackEvent('Feedback', 'Submitted', feedbackType, rating || undefined);

      // TODO: Send to your backend API
      // await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(feedbackData),
      // });

      console.log('[Feedback] Submitted:', feedbackData);

      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('[Feedback] Submission failed:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSentryReport = () => {
    showSentryFeedbackDialog();
    trackEvent('Feedback', 'Sentry Report Opened');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          aria-label="Open feedback widget"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Feedback Panel */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-96 max-h-[600px] overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-orange-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-semibold">{submitted ? 'Thank You!' : 'Send Feedback'}</h3>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-orange-700 rounded p-1 transition-colors"
              aria-label="Close feedback widget"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {submitted ? (
              // Success Message
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Feedback Received!
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Thank you for helping us improve NataCarePM.
                </p>
              </div>
            ) : !feedbackType ? (
              // Feedback Type Selection
              <div className="space-y-3">
                <p className="text-gray-700 dark:text-gray-300 mb-4">How can we help you today?</p>

                <button
                  onClick={() => setFeedbackType('bug')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                >
                  <Bug className="w-6 h-6 text-red-500" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Report a Bug</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Something isn't working correctly
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFeedbackType('suggestion')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                >
                  <Lightbulb className="w-6 h-6 text-yellow-500" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Suggest Improvement
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Share your ideas with us
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFeedbackType('satisfaction')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                >
                  <ThumbsUp className="w-6 h-6 text-green-500" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Rate Your Experience
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tell us how we're doing
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFeedbackType('general')}
                  className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all"
                >
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      General Feedback
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Share your thoughts
                    </div>
                  </div>
                </button>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSentryReport}
                    className="w-full text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                  >
                    Report an error with details →
                  </button>
                </div>
              </div>
            ) : (
              // Feedback Form
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating (for satisfaction type) */}
                {feedbackType === 'satisfaction' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      How satisfied are you?
                    </label>
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`w-12 h-12 rounded-full border-2 transition-all ${
                            rating === value
                              ? 'border-orange-500 bg-orange-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-orange-400'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label
                    htmlFor="feedback-message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Your feedback
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder={
                      feedbackType === 'bug'
                        ? 'Describe the issue you encountered...'
                        : feedbackType === 'suggestion'
                          ? 'Share your ideas for improvement...'
                          : 'Tell us what you think...'
                    }
                  />
                </div>

                {/* Email (optional) */}
                {collectEmail && (
                  <div>
                    <label
                      htmlFor="feedback-email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email (optional)
                    </label>
                    <input
                      id="feedback-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="your@email.com"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      We'll contact you if we need more details
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackType(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFeedbackWidget;

