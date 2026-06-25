"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Global imperative toast API - works from anywhere including zustand store
type ToastListener = (toast: ToastData) => void;
let globalListener: ToastListener | null = null;

export const toast = {
  success: (message: string, duration = 3000) => {
    globalListener?.({ id: `t_${Date.now()}_${Math.random()}`, message, type: 'success', duration });
  },
  error: (message: string, duration = 4000) => {
    globalListener?.({ id: `t_${Date.now()}_${Math.random()}`, message, type: 'error', duration });
  },
  info: (message: string, duration = 3000) => {
    globalListener?.({ id: `t_${Date.now()}_${Math.random()}`, message, type: 'info', duration });
  },
  warning: (message: string, duration = 3500) => {
    globalListener?.({ id: `t_${Date.now()}_${Math.random()}`, message, type: 'warning', duration });
  },
};

// Also export useToast as a hook wrapper for components that prefer hooks
export const useToast = () => toast;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Register global listener
  useEffect(() => {
    globalListener = (t: ToastData) => {
      setToasts(prev => [...prev, t]);
    };
    return () => { globalListener = null; };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <>
      {children}
      {/* Toast Container — bottom-right, stacks upward */}
      <div className="fixed bottom-8 right-4 z-[100] flex flex-col-reverse gap-2 max-w-sm pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} data={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </>
  );
};

const ToastItem: React.FC<{ data: ToastData; onDismiss: () => void }> = ({ data, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, data.duration);
    return () => clearTimeout(timer);
  }, [data.duration, onDismiss]);

  const iconMap = {
    success: <CheckCircle2 size={16} className="text-green-400 shrink-0" />,
    error: <AlertCircle size={16} className="text-red-400 shrink-0" />,
    warning: <AlertTriangle size={16} className="text-yellow-400 shrink-0" />,
    info: <Info size={16} className="text-blue-400 shrink-0" />,
  };

  const borderMap = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-yellow-500',
    info: 'border-l-blue-500',
  };

  return (
    <div className={`pointer-events-auto flex items-start space-x-3 bg-[#2A2A2A] border border-[#404040] border-l-4 ${borderMap[data.type]} rounded-lg shadow-2xl px-4 py-3 min-w-[280px] animate-slide-in`}>
      {iconMap[data.type]}
      <span className="text-sm text-gray-200 flex-1">{data.message}</span>
      <button onClick={onDismiss} className="text-gray-500 hover:text-gray-300 shrink-0 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};
