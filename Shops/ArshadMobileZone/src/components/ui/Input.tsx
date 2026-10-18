import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    
    return (
      <div className="w-full">
        <div className="relative">
          <input
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              'peer w-full rounded-xl border bg-white px-4 pb-2 pt-6 text-gray-900 outline-none transition-all',
              'border-gray-200 focus:border-forest focus:ring-1 focus:ring-forest/20',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              icon && 'pl-11',
              className
            )}
            placeholder=" "
            ref={ref}
            {...props}
          />
          <label
            className={cn(
              'pointer-events-none absolute left-4 top-4 text-gray-400 transition-all duration-200',
              'peer-focus:-translate-y-3 peer-focus:text-xs peer-focus:text-forest',
              'peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-500',
              icon && 'left-11'
            )}
          >
            {label}
          </label>
          
          {icon && (
            <div className="absolute left-4 top-4 text-gray-400">
              {icon}
            </div>
          )}

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs font-medium text-red-500 px-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
