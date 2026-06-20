"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            "w-full px-4 py-2.5 rounded-xl border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500",
            "bg-white/50 dark:bg-white/5 backdrop-blur-sm",
            "border-gray-200 dark:border-white/10",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
            "transition-all duration-200",
            error && "border-red-300 dark:border-red-800 focus:ring-red-500/20 focus:border-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;

export function Select({
  label,
  error,
  options,
  className,
  id,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  className?: string;
  id?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border text-gray-900 dark:text-white",
          "bg-white/50 dark:bg-white/5 backdrop-blur-sm",
          "border-gray-200 dark:border-white/10",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
          "transition-all duration-200",
          "[color-scheme:light] dark:[color-scheme:dark]",
          error && "border-red-300",
          className
        )}
      >
        {placeholder && <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
