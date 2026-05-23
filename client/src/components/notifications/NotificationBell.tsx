import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: '42px',
        height: '42px',
        borderRadius: '14px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
      }}
      className="glass-card-hover"
      aria-label="Toggle notifications"
    >
      <Bell size={18} />
      
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--danger)',
            color: 'white',
            fontSize: '9px',
            fontWeight: 800,
            minWidth: '18px',
            height: '18px',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 0 10px rgba(248, 113, 113, 0.4)',
            border: '2px solid var(--bg-primary)',
            animation: 'pulseGlow 2s infinite',
          }}
        >
          {unreadCount}
        </span>
      )}

      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </button>
  );
};
