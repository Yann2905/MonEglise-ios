'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IOSTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const IOSTextField = forwardRef<HTMLInputElement, IOSTextFieldProps>(
  ({ label, error, leftIcon, rightIcon, className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label className="block text-[13px] font-semibold uppercase tracking-[0.06em] text-ios-label-light/70 mb-2 px-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-gray pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white text-ios-label-light rounded-ios-lg',
              'h-14 px-4 outline-none transition-all',
              'placeholder:text-ios-gray2 font-medium tracking-sf-tight',
              'border border-ios-gray5',
              'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              error && 'border-ios-red focus:border-ios-red focus:ring-ios-red/20',
              className
            )}
            style={{ fontSize: 17 }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ios-gray">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-[13px] text-ios-red px-1 tracking-sf-tight">{error}</p>
        )}
      </div>
    );
  }
);

IOSTextField.displayName = 'IOSTextField';
