/**
 * ImageVisLab - Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing.
 * 
 * @module ErrorBoundary
 * @author ImageVisLab Contributors
 * @license MIT
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import './ErrorBoundary.css';

// =============================================================================
// Types
// =============================================================================

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

// =============================================================================
// Component
// =============================================================================

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <div className="error-icon">⚠️</div>
                        <h2 className="error-title">Something went wrong</h2>
                        <p className="error-message">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button className="error-reset-btn" onClick={this.handleReset}>
                            Try Again
                        </button>
                        {this.state.errorInfo && (
                            <details className="error-details">
                                <summary>Error Details</summary>
                                <pre>{this.state.errorInfo.componentStack}</pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
