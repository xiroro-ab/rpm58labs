import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="bg-white/95 border border-slate-100 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 backdrop-blur-md"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <Loader2 className="w-14 h-14 text-blue-600 animate-spin relative z-10" />
            </div>
            <p className="text-lg font-bold text-slate-800 text-center tracking-tight">
              {message}
            </p>
            <p className="text-sm text-slate-500 text-center mt-2 font-medium">
              Maleskan Nunggu? namonyo jugo gratisan...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
