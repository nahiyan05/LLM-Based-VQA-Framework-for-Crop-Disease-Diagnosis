import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              There was an error rendering this component.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Error Details
              </summary>
              <pre className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
