import React from 'react';
import { X, Check, Bell, Calendar, Trash2, ShieldAlert } from 'lucide-react';
import { type Order, type Customer } from '../../services/dbService';
import { type AppNotification } from '../../services/notificationService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  tomorrowOrders: Order[];
  customers: Customer[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  tomorrowOrders,
  customers,
  unreadCount,
  loading,
  markAsRead,
  markAllAsRead,
  deleteNotification,
}) => {
  if (!isOpen) return null;

  const getCustName = (id: string) => {
    return customers.find(c => c.id === id)?.name || 'Guest Customer';
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={onClose}>
      <div
        className="modal-sheet"
        style={{
          background: 'var(--bg-secondary)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderTop: '1px solid var(--glass-border-strong)',
          boxShadow: 'var(--glass-shadow)',
          maxHeight: '90%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Handle bar */}
        <div className="modal-handle" style={{ background: 'var(--text-dim)', width: '40px', height: '4px', marginBottom: '14px' }} />

        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Royal Assistant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Smart Reminders</h2>
              {unreadCount > 0 && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger)', background: 'var(--danger-bg)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(248, 113, 113, 0.15)' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '7px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                className="glass-card-hover"
              >
                Mark Read
              </button>
            )}
            
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              className="glass-card-hover"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px', paddingRight: '2px' }} className="modal-body">
          
          {/* ── PART 1: DUE TOMORROW BREAKDOWN ── */}
          <div>
            <div className="section-label" style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Deadlines Due Tomorrow</div>
            
            {loading ? (
              <div className="skeleton" style={{ height: '76px', borderRadius: '16px' }} />
            ) : tomorrowOrders.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(52, 211, 153, 0.03)',
                  border: '1px solid rgba(52, 211, 153, 0.1)'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(52, 211, 153, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                  <Check size={15} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>All caught up for tomorrow!</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>No active tailoring deliveries scheduled tomorrow.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tomorrowOrders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {getCustName(order.customer_id)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{order.cloth_type}</span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span>Qty: {order.quantity}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--warning)',
                          background: 'var(--warning-bg)',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          border: '1px solid rgba(251, 191, 36, 0.15)'
                        }}
                      >
                        <Calendar size={10} /> Tomorrow
                      </span>
                      {order.remaining_amount > 0 && (
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)', marginTop: '4px' }}>
                          ₨{order.remaining_amount.toLocaleString()} due
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PART 2: NOTIFICATION LOGS HISTORY ── */}
          <div>
            <div className="section-label" style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Alert Activity Logs</div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton" style={{ height: '64px', borderRadius: '16px' }} />
                <div className="skeleton" style={{ height: '64px', borderRadius: '16px' }} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="glass-card" style={{ padding: '30px 20px', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
                <Bell size={20} color="var(--text-muted)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>No alert logs tracked yet</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Your daily delivery logs and updates will sync here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.map(notif => {
                  const unread = !notif.is_read;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => { if (unread) markAsRead(notif.id); }}
                      style={{
                        padding: '13px 14px',
                        borderRadius: '16px',
                        background: unread ? 'var(--glass-bg-elevated)' : 'var(--glass-bg)',
                        border: `1.5px solid ${unread ? 'var(--glass-border-strong)' : 'var(--glass-border)'}`,
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        cursor: unread ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Alert Icon */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: unread ? 'var(--warning-bg)' : 'var(--glass-bg-strong)',
                          border: `1px solid ${unread ? 'rgba(251, 191, 36, 0.15)' : 'var(--glass-border)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: unread ? 'var(--warning)' : 'var(--text-muted)',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {notif.title.includes('Reminder') ? <Calendar size={15} /> : <ShieldAlert size={15} />}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: unread ? 800 : 700, color: unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {notif.title.split(' - ')[0]}
                          </span>
                          {unread && (
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 6px var(--danger)' }} />
                          )}
                        </div>
                        
                        <p style={{ fontSize: '12px', color: unread ? 'var(--text-secondary)' : 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                          {notif.message}
                        </p>
                        
                        {notif.created_at && (
                          <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '6px', fontWeight: 500 }}>
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          alignSelf: 'center',
                          transition: 'color 0.15s ease'
                        }}
                        className="glass-card-hover"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
