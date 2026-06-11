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
          <label className="block text-[13px] font-semibold uppercase tracking-wider text-ios-gray mb-2 px-1">
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
              'w-full bg-ios-gray6 text-ios-label-light rounded-ios-lg',
              'h-14 px-4 outline-none transition-all',
              'placeholder:text-ios-gray font-normal tracking-sf-tight',
              'focus:bg-white focus:ring-2 focus:ring-brand-500/40',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              error && 'ring-2 ring-ios-red/40',
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
