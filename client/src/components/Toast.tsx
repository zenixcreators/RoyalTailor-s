import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Render Area inside Mobile Bezel */}
      <div 
        style={{
          position: 'absolute',
          top: '20px',
          left: '16px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-card"
            style={{
              padding: '12px 16px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${
                toast.type === 'success' ? 'rgba(29, 138, 99, 0.18)' :
                toast.type === 'error' ? 'rgba(207, 60, 60, 0.18)' :
                toast.type === 'warning' ? 'rgba(178, 123, 0, 0.18)' :
                'rgba(33, 114, 215, 0.18)'
              }`,
              boxShadow: '0 8px 30px rgba(26, 45, 66, 0.06)',
              transform: 'translateY(0)',
              animation: 'toastSlideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {toast.type === 'success' && <CheckCircle size={18} color="var(--success)" />}
              {toast.type === 'error' && <AlertCircle size={18} color="var(--danger)" />}
              {toast.type === 'warning' && <AlertCircle size={18} color="var(--warning)" />}
              {toast.type === 'info' && <Info size={18} color="var(--accent-blue)" />}
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastSlideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
