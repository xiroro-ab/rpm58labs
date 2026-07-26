import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Ya, Hapus', cancelLabel = 'Batal', variant = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colors = {
    danger: { bg: 'bg-red-50', border: 'border-red-200', btn: 'bg-red-600 hover:bg-red-700', icon: 'text-red-600' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', btn: 'bg-amber-600 hover:bg-amber-700', icon: 'text-amber-600' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', btn: 'bg-blue-600 hover:bg-blue-700', icon: 'text-blue-600' },
  };

  const c = colors[variant];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className={`${c.bg} ${c.border} border-b p-5 flex items-center gap-3`}>
          <div className="p-2 bg-white rounded-full shadow-sm">
            <AlertTriangle className={`w-5 h-5 ${c.icon}`} />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{message}</p>
          <div className="flex gap-3 mt-5 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-semibold text-white ${c.btn} rounded-lg transition-colors shadow-sm`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper hook
export function useConfirm() {
  const [state, setState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
    confirmLabel?: string;
    resolve?: (value: boolean) => void;
  }>({ isOpen: false, title: '', message: '' });

  const confirm = (title: string, message: string, variant?: 'danger' | 'warning' | 'info', confirmLabel?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, title, message, variant, confirmLabel, resolve });
    });
  };

  const handleConfirm = () => {
    state.resolve?.(true);
    setState({ isOpen: false, title: '', message: '' });
  };

  const handleCancel = () => {
    state.resolve?.(false);
    setState({ isOpen: false, title: '', message: '' });
  };

  return {
    confirm,
    dialog: (
      <ConfirmDialog
        isOpen={state.isOpen}
        title={state.title}
        message={state.message}
        variant={state.variant}
        confirmLabel={state.confirmLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )
  };
}
