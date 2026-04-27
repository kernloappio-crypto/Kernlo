'use client';

import React, { ReactNode, ReactElement } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactElement;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    console.error('[ErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  public render() {
    if (this.state.hasError) {
      console.log('[ErrorBoundary] Rendering fallback UI');
      return (
        this.props.fallback ? this.props.fallback(this.state.error!) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Component</h3>
            <p className="text-sm text-gray-600 mb-4">
              Something went wrong. Please try again.
            </p>
            <details className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-200 mt-4">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 overflow-auto text-xs whitespace-pre-wrap break-words">
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
