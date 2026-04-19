import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = () => {
    const errorDetails = `Error: ${this.state.error?.message || 'Unknown error'}\n\nStack: ${this.state.error?.stack || 'No stack trace'}\n\nComponent Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}`;
    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('Error details copied to clipboard');
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '500px',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}>
              ⚠️
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#ffffff',
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#a0a0a0',
              marginBottom: '24px',
              lineHeight: 1.5,
            }}>
              We encountered an unexpected error. Please try reloading the page.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: '#a0a0a0',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.color = '#a0a0a0';
                }}
              >
                Go to Home
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <div style={{ marginTop: '32px', textAlign: 'left' }}>
                <button
                  onClick={this.handleCopyError}
                  style={{
                    marginBottom: '12px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    backgroundColor: '#1a1a2e',
                    color: '#a0a0a0',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Copy Error Details
                </button>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#1a1a2e',
                  borderRadius: '8px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}>
                  <pre style={{ margin: 0, color: '#ef4444', whiteSpace: 'pre-wrap' }}>
                    {this.state.error.message}
                  </pre>
                  {this.state.error.stack && (
                    <pre style={{ margin: '8px 0 0', color: '#666', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
