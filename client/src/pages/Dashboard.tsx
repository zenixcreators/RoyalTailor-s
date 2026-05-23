import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NotificationBell } from '../components/notifications/NotificationBell';

interface Order {
  id: string;
  cloth_type: string;
  quantity: number;
  status: string;
  delivery_date: string;
  total_amount: number;
  advance_amount: number;
  remaining_amount: number;
  cloth_image?: string;
}

interface Stats {
  pendingOrders: number;
  todayDue: number;
  totalCustomers: number;
  revenue: number;
  recentOrders: Order[];
}

interface DashboardProps {
  onOpenWizard: () => void;
  unreadCount: number;
  onOpenNotif: () => void;
}

const Dashboard = ({ onOpenWizard, unreadCount, onOpenNotif }: DashboardProps) => {
  const [stats, setStats] = useState<Stats>({
    pendingOrders: 0,
    todayDue: 0,
    totalCustomers: 0,
    revenue: 0,
    recentOrders: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const { data: customers } = await supabase
          .from('customers')
          .select('*');

        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        const safeCustomers = customers || [];
        const safeOrders = orders || [];

        const pendingOrders = safeOrders.filter(
          (order) => order.status !== 'Delivered'
        ).length;

        const today = new Date().toISOString().split('T')[0];

        const todayDue = safeOrders.filter(
          (order) => order.delivery_date === today
        ).length;

        const revenue = safeOrders.reduce(
          (total, order) => total + Number(order.total_amount || 0),
          0
        );

        setStats({
          pendingOrders,
          todayDue,
          totalCustomers: safeCustomers.length,
          revenue,
          recentOrders: safeOrders.slice(0, 5) as Order[],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '28px', width: '160px' }} />
          </div>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '16px' }} />
        </div>

        {/* Action Button Skeleton */}
        <div className="skeleton" style={{ height: '88px', borderRadius: '20px' }} />

        {/* Stats Grid Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '20px' }} />
          ))}
        </div>

        {/* Recent Orders Section Skeleton */}
        <div>
          <div className="skeleton" style={{ height: '12px', width: '60px', marginBottom: '6px' }} />
          <div className="skeleton" style={{ height: '22px', width: '120px', marginBottom: '4px' }} />
          <div className="skeleton" style={{ height: '14px', width: '180px', marginBottom: '14px' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[0, 1].map((i) => (
              <div key={i} className="skeleton skeleton-card" style={{ height: '90px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      
      {/* ── BRAND HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '2px' }}>Atelier</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Royal Tailor
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Premium Tailoring Management
          </p>
        </div>
        <NotificationBell unreadCount={unreadCount} onClick={onOpenNotif} />
      </div>

      {/* ── PRIMARY WORKFLOW CTA ── */}
      <div 
        className="glass-card glass-card-hover"
        onClick={onOpenWizard}
        style={{
          cursor: 'pointer',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid rgba(201, 169, 110, 0.25)',
          background: 'linear-gradient(135deg, rgba(201, 169, 110, 0.12) 0%, rgba(201, 169, 110, 0.03) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div className="section-label" style={{ color: 'var(--accent-gold)', marginBottom: '4px' }}>Start New Order</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            New Stitching
          </h2>
        </div>
        <div style={{ 
          width: '44px', 
          height: '44px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, var(--accent-gold-light) 0%, var(--accent-gold) 100%)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(201, 169, 110, 0.2)'
        }}>
          <ArrowRight size={18} color="var(--bg-primary)" />
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '16px' }}>
          <div className="section-label" style={{ fontSize: '9px', marginBottom: '8px' }}>Pending</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-blue)', margin: 0 }}>
            {stats.pendingOrders}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div className="section-label" style={{ fontSize: '9px', marginBottom: '8px' }}>Deliveries</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#a78bfa', margin: 0 }}>
            {stats.todayDue}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div className="section-label" style={{ fontSize: '9px', marginBottom: '8px' }}>Customers</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {stats.totalCustomers}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '16px' }}>
          <div className="section-label" style={{ fontSize: '9px', marginBottom: '8px' }}>Revenue</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success)', margin: 0 }}>
            ₹{stats.revenue.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* ── SECTION HEADER ── */}
      <div style={{ marginBottom: '16px' }}>
        <div className="section-label" style={{ marginBottom: '2px' }}>Workflow</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Recent Orders
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
          Latest tailoring activity
        </p>
      </div>

      {/* ── RECENT ORDERS LIST ── */}
      {stats.recentOrders.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>✂️</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            No Orders Yet
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stats.recentOrders.map((order) => (
            <div
              key={order.id}
              className="glass-card glass-card-hover"
              style={{ padding: '15px 16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {order.cloth_type}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Delivery: {order.delivery_date}
                  </div>
                </div>
                <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                <span>Qty: <strong style={{ color: 'var(--text-primary)' }}>{order.quantity}</strong></span>
                <span style={{ fontWeight: 700, color: order.remaining_amount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {order.remaining_amount > 0 ? `₹${order.remaining_amount.toLocaleString()} due` : '✓ Paid'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;