import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}>
            Something went wrong
          </h3>
          <p style={{ fontSize: '0.88rem', marginBottom: '20px' }}>
            An error occurred while rendering this content.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--accent-light)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          {this.state.error && (
            <pre style={{
              marginTop: '20px',
              padding: '12px',
              fontSize: '0.75rem',
              color: '#c0392b',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '120px',
            }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
