"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-700 hover:to-purple-700 dark:shadow-indigo-500/10":
              variant === "primary",
            "glass-strong text-gray-700 dark:text-gray-200 hover:bg-white/60 dark:hover:bg-white/10":
              variant === "secondary",
            "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-600 hover:to-rose-600":
              variant === "danger",
            "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5":
              variant === "ghost",
            "border-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20":
              variant === "outline",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-5 py-2.5 text-sm": size === "md",
            "px-7 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
