"use client";

import { Component, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[400px] flex items-center justify-center"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle size={36} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">حدث خطأ غير متوقع</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              {this.state.error?.message || "يرجى المحاولة مرة أخرى"}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
            >
              <RefreshCw size={16} />
              إعادة التحميل
            </Button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
