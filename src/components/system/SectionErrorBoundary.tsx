import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Copy, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  title?: string;
  message?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetNonce: number;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, resetNonce: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SectionErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      resetNonce: prev.resetNonce + 1,
    }));
  };

  handleCopyError = () => {
    const errorDetails = `Error: ${this.state.error?.message || "Unknown error"}\n\nStack: ${this.state.error?.stack || "No stack trace"}\n\nComponent Stack: ${this.state.errorInfo?.componentStack || "No component stack"}`;
    void navigator.clipboard.writeText(errorDetails);
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="rounded-md bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-base font-semibold">
                    {this.props.title || "This section is temporarily unavailable"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {this.props.message || "A rendering error occurred in this section. The rest of the page is still available."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={this.handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset section
                  </Button>
                  <Button size="sm" variant="ghost" onClick={this.handleCopyError}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy error details
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return <React.Fragment key={this.state.resetNonce}>{this.props.children}</React.Fragment>;
  }
}