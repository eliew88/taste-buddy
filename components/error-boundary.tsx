/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the component tree and displays
 * a fallback UI instead of crashing the entire application. Provides
 * error reporting and recovery mechanisms.
 * 
 * Location: components/ErrorBoundary.tsx
 * 
 * Features:
 * - Catches and displays React component errors
 * - Provides error recovery with retry functionality
 * - Logs errors for debugging and monitoring
 * - Responsive fallback UI with helpful messaging
 * - Different error types (component errors vs API errors)
 * - Development vs production error details
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * ErrorBoundary Class Component
 * 
 * Must be a class component as React error boundaries cannot be functional components.
 * Catches errors in child components and provides recovery mechanisms.
 */
class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  /**
   * Static method called when an error occurs
   * Updates state to trigger error UI rendering
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Called after an error has been caught
   * Logs error information and handles error reporting internally
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Handle error reporting internally
    this.handleGlobalError(error, errorInfo);

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  /**
   * Internal error handler
   * Logs errors and handles global error processing
   */
  private handleGlobalError = (error: Error, errorInfo: ErrorInfo) => {
    // Log error details
    console.error('Global error caught by boundary:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
    });

    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error monitoring service
      // errorMonitoringService.captureException(error, {
      //   tags: { location: 'global_boundary' },
      //   extra: errorInfo,
      // });
    }
  };

  /**
   * Reports error to external monitoring service
   * In a real app, this would send to services like Sentry, LogRocket, etc.
   */
  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Example error reporting (replace with your preferred service)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In production, send to error reporting service
    console.warn('Error report:', errorReport);
    
    // Example: Send to external service
    // errorReportingService.captureException(error, errorReport);
  };

  /**
   * Attempts to recover from the error by resetting state
   */
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  /**
   * Reloads the entire page as a last resort
   */
  private handleReload = () => {
    window.location.reload();
  };

  /**
   * Navigates back to homepage
   */
  private handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * Copies error details to clipboard for bug reporting
   */
  private handleCopyError = async () => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorDetails = `
Error ID: ${this.state.errorId}
Message: ${this.state.error.message}
Stack: ${this.state.error.stack}
Component Stack: ${this.state.errorInfo.componentStack}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorDetails);
      alert('Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI prop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>

              {/* Error Title */}
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>

              {/* Error Message */}
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Don&apos;t worry, this has been reported 
                and we&apos;re working to fix it.
              </p>

              {/* Error ID (for support) */}
              {this.state.errorId && (
                <p className="text-xs text-gray-500 mb-6 font-mono bg-gray-100 p-2 rounded">
                  Error ID: {this.state.errorId}
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </button>

                  <button
                    onClick={this.handleReload}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Reload Page
                  </button>
                </div>

                {/* Development/Debug Actions */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="text-left">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 mb-2">
                      🐛 Debug Information
                    </summary>
                    <div className="bg-gray-100 p-3 rounded text-xs font-mono text-left overflow-auto max-h-32">
                      <p><strong>Error:</strong> {this.state.error?.message}</p>
                      <p><strong>Stack:</strong></p>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error?.stack}
                      </pre>
                    </div>
                    <button
                      onClick={this.handleCopyError}
                      className="mt-2 text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded flex items-center"
                    >
                      <Bug className="w-3 h-3 mr-1" />
                      Copy Error Details
                    </button>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;