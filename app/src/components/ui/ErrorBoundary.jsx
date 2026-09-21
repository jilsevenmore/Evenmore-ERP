/**
 * ErrorBoundary — from ERP ErrorBoundary.jsx
 * User-facing fallback strings are localized; technical error details
 * (message/stack) are rendered unchanged for debugging.
 */
import { Component } from 'react';
import { useTranslation } from '../../i18n';

class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    const { title, message, retryLabel } = this.props;
    if (this.state.hasError) {
      return (
        <div className="empty-state" style={{ padding: 48 }}>
          <h3 style={{ color: '#ef4444' }}>{title}</h3>
          <p>{this.state.error?.message || message}</p>
          {this.state.error?.stack && (
            <pre style={{ marginTop: 12, padding: 12, background: '#f1f5f9', borderRadius: 8, fontSize: 11, textAlign: 'left', overflow: 'auto', maxWidth: '100%', color: '#dc2626', whiteSpace: 'pre-wrap' }}>
              {this.state.error.stack}
            </pre>
          )}
          <button
            type="button"
            className="btn-outline"
            style={{ marginTop: 16 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            {retryLabel}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundary({ children }) {
  const { t } = useTranslation();
  return (
    <ErrorBoundaryInner
      title={t('error.somethingWrong')}
      message={t('error.unexpected')}
      retryLabel={t('error.tryAgain')}
    >
      {children}
    </ErrorBoundaryInner>
  );
}

export default ErrorBoundary;
