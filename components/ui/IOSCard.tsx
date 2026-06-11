'use client';

import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface IOSCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glass' | 'pastel';
  pastelColor?: 'blue' | 'orange' | 'green' | 'teal' | 'purple' | 'red';
  interactive?: boolean;
}

const pastelBackgrounds: Record<string, string> = {
  blue: 'bg-gradient-to-br from-blue-50 to-blue-100/60',
  orange: 'bg-gradient-to-br from-orange-50 to-orange-100/60',
  green: 'bg-gradient-to-br from-green-50 to-green-100/60',
  teal: 'bg-gradient-to-br from-teal-50 to-teal-100/60',
  purple: 'bg-gradient-to-br from-purple-50 to-purple-100/60',
  red: 'bg-gradient-to-br from-red-50 to-red-100/60',
};

export function IOSCard({
  variant = 'default',
  pastelColor,
  interactive,
  className,
  children,
  ...props
}: IOSCardProps) {
  const base = 'rounded-ios-lg shadow-ios-sm';

  const variants = {
    default: 'bg-white',
    glass: 'ios-glass',
    pastel: pastelColor ? pastelBackgrounds[pastelColor] : 'bg-ios-gray6',
  };

  return (
    <motion.div
      whileTap={interactive ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
