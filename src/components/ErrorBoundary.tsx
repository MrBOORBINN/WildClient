import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error trapped by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('infbott_sessions');
      localStorage.removeItem('wildstar_sessions');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#131314] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1e1f20] border border-white/10 rounded-3xl p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Something went wrong</h1>
              <p className="text-xs text-[#8e918f] leading-relaxed">
                An unexpected interface issue occurred. You can reload INFBOTT or reset local session cache to continue smoothly.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-left max-h-28 overflow-y-auto font-mono text-[11px] text-red-400/90 break-words">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-[#4285f4] hover:bg-[#4285f4]/80 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <RefreshCw size={14} />
                <span>Reload INFBOTT</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#c4c7c5] hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
