import { useState, useEffect } from 'react';
import { Home, Users, Scissors, DollarSign, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { ToastProvider } from './components/Toast';
import { NewOrderWizard } from './components/NewOrderWizard';
import Dashboard from "./pages/Dashboard";
import { Customers } from './pages/Customers';
import { Orders } from './pages/Orders';
import { Finances } from './pages/Finances';
import { Settings } from './pages/Settings';
import { isSupabaseConfigured } from './lib/supabase';
import { useNotifications } from './hooks/useNotifications';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', Icon: Home },
  { id: 'orders', label: 'Stitching', Icon: Scissors },
  { id: 'customers', label: 'Clients', Icon: Users },
  { id: 'finances', label: 'Ledger', Icon: DollarSign },
  { id: 'settings', label: 'Settings', Icon: SlidersHorizontal },
];

function MainApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Initialize theme from local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('rt_theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, []);


  const {
    notifications,
    tomorrowOrders,
    customers,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications();

  const openWizard = () => setIsWizardOpen(true);
  const closeWizard = () => setIsWizardOpen(false);
  const onWizardComplete = () => {
    setRefreshKey(k => k + 1);
    refresh();
  };

  return (
    <>
      {/* Fixed ambient glow background — rendered outside flex flow */}
      <div className="ambient-glow-wrapper">
        <div className="glow-blob glow-blue" />
        <div className="glow-blob glow-silver" />
      </div>

      {/* Full-viewport centering wrapper */}
      <div className="app-container">

        {/* Phone shell */}
        <div className="mobile-shell">

          {/* Scrollable content area */}
          <main className="app-viewport">
            {/* Apple-style Failure/Offline banner when Supabase database is disconnected */}
            {!isSupabaseConfigured && (
              <div className="warning-banner">
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--warning)' }}>Offline Sandboxed Mode</div>
                  <div style={{ fontSize: '11px', opacity: 0.85, lineHeight: '1.4' }}>
                    Supabase connection is not configured. All changes will be saved to your local browser database sandbox.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && <Dashboard key={`dash-${refreshKey}`} onOpenWizard={openWizard} unreadCount={unreadCount} onOpenNotif={() => setIsDrawerOpen(true)} />}
            {activeTab === 'orders' && <Orders key={`ord-${refreshKey}`} onOpenWizard={openWizard} unreadCount={unreadCount} onOpenNotif={() => setIsDrawerOpen(true)} />}
            {activeTab === 'customers' && <Customers key={`cust-${refreshKey}`} unreadCount={unreadCount} onOpenNotif={() => setIsDrawerOpen(true)} />}
            {activeTab === 'finances' && <Finances key={`fin-${refreshKey}`} unreadCount={unreadCount} onOpenNotif={() => setIsDrawerOpen(true)} />}
            {activeTab === 'settings' && <Settings />}
          </main>

          {/* Bottom navigation bar */}
          <nav className="bottom-nav-bar">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="bottom-nav-btn"
                  style={{
                    color: active ? 'var(--accent-gold)' : 'var(--text-muted)',
                  }}
                >
                  <Icon
                    size={active ? 22 : 20}
                    strokeWidth={active ? 2.5 : 1.8}
                    style={{
                      filter: active ? 'drop-shadow(0 0 4px rgba(26,45,66,0.18))' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '0.01em',
                  }}>
                    {label}
                  </span>

                  {active && (
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-gold)',
                      boxShadow: '0 0 8px var(--accent-gold)',
                      animation: 'dotSpring 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.2)',
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* 6-step New Stitching Wizard overlay */}
          <NewOrderWizard
            isOpen={isWizardOpen}
            onClose={closeWizard}
            onComplete={onWizardComplete}
          />

          {/* Assistant Smart Notifications Drawer bottom sheet */}
          <NotificationDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            notifications={notifications}
            tomorrowOrders={tomorrowOrders}
            customers={customers}
            unreadCount={unreadCount}
            loading={loading}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            deleteNotification={deleteNotification}
          />

        </div>
      </div>

      <style>{`
        @keyframes dotSpring {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
      `}</style>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
