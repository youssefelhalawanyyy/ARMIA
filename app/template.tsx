'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className="flex-grow flex flex-col w-full">{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1], // luxury spring/easeOut curve
      }}
      className="flex-grow flex flex-col w-full will-change-[opacity,transform]"
    >
      {children}
    </motion.div>
  );
}
