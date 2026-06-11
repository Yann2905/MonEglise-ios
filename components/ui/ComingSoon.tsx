'use client';

import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-brand-100"
      >
        <Sparkles className="h-12 w-12 text-brand-600" />
      </motion.div>
      <motion.h2
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-6 text-[28px] font-bold tracking-sf-tighter"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 text-[15px] text-ios-gray tracking-sf-tight max-w-sm"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
