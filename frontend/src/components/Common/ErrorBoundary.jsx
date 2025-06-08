import React from 'react';
import { logError, ERROR_SEVERITY } from '../../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for monitoring
    logError(
      error,
      `React component error in ${this.props.fallbackComponent || 'unknown component'}`,
      ERROR_SEVERITY.HIGH
    );

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send to external error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            border: '1px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#c92a2a', marginBottom: '16px' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            We&apos;re sorry, but something unexpected happened. Please try
            refreshing the page.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details
              style={{
                marginTop: '16px',
                textAlign: 'left',
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '4px',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details (Development Only)
              </summary>
              <pre
                style={{
                  fontSize: '12px',
                  overflow: 'auto',
                  marginTop: '8px',
                  color: '#c92a2a',
                }}
              >
                {this.state.error
                  ? this.state.error.toString()
                  : 'No error details'}
                {this.state.errorInfo?.componentStack ||
                  'No component stack available'}
              </pre>
            </details>
          )}

          <div style={{ marginTop: '16px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#228be6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '8px',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#868e96',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
