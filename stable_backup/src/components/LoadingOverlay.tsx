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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4"
          >
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-lg font-semibold text-slate-800 text-center">
              {message}
            </p>
            <p className="text-sm text-slate-500 text-center mt-2">
              Maleskan Nunggu ? namonyo jugo gratisan...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
