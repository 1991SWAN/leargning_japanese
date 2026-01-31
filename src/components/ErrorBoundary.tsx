'use client';

import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="error-container glass-card">
                    <div className="error-content">
                        <span className="error-icon">⚠️</span>
                        <h2>문제가 발생했습니다.</h2>
                        <p>죄송합니다. 앱을 불러오는 중 예기치 못한 오류가 발생했습니다.</p>
                        <pre className="error-stack">{this.state.error?.message}</pre>
                        <button
                            className="btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            다시 시도하기
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
