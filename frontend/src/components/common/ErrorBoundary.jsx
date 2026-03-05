import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("🚨 [Application Crash Boundary]:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-4xl mb-6">
                        ⚠️
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
                    <p className="text-slate-600 mb-8 max-w-md">
                        The application encountered an unexpected error. Don't worry, your data is safe.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
                        >
                            Reload Page
                        </button>
                        <button
                            onClick={() => window.location.href = '/home'}
                            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Go to Home
                        </button>
                    </div>
                    {process.env.NODE_ENV !== 'production' && (
                        <pre className="mt-8 p-4 bg-slate-800 text-red-400 text-left text-xs rounded-lg overflow-auto max-w-2xl">
                            {this.state.error?.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
