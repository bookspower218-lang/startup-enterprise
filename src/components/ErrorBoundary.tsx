import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="max-w-lg rounded-2xl border border-border bg-card p-8">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {this.state.error.message}
            </p>
            <button
              type="button"
              className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
