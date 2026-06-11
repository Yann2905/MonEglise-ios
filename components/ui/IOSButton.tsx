'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface IOSButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

export function IOSButton({
  variant = 'primary',
  size = 'md',
  isLoading,
  fullWidth,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: IOSButtonProps) {
  const variants = {
    primary:
      'bg-brand-600 text-white shadow-ios hover:shadow-ios-lg',
    secondary:
      'bg-ios-gray6 text-brand-600',
    destructive: 'bg-ios-red text-white shadow-ios',
    ghost: 'bg-transparent text-brand-600',
  };

  const sizes = {
    sm: 'h-10 px-4 text-[15px] rounded-ios',
    md: 'h-12 px-5 text-[16px] rounded-ios-lg',
    lg: 'h-14 px-6 text-[17px] rounded-ios-lg',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'transition-opacity duration-150 select-none touch-manipulation',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'tracking-sf-tight',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {leftIcon && <span className="-ml-0.5">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="-mr-0.5">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}

function Spinner() {
  return (
    <div className="relative h-5 w-5">
      <div className="absolute inset-0 rounded-full border-2 border-white/30" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin" />
    </div>
  );
}
