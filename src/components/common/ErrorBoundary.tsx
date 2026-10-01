import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught runtime error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
          <div className="max-w-md w-full p-8 rounded-3xl border border-border bg-card shadow-2xl space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-xs text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred in MASTER CLOUD.'}
            </p>
            {this.state.error?.stack && (
              <pre className="text-left font-mono text-[10px] text-destructive bg-destructive/5 p-3 rounded-xl overflow-auto max-h-40 whitespace-pre-wrap">
                {this.state.error.stack}
              </pre>
            )}
            <Button onClick={this.handleReset} className="w-full rounded-xl text-xs font-semibold">
              <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
