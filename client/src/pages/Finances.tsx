import React, { useEffect, useState } from 'react';
import { Plus, Trash2, IndianRupee, TrendingUp, Clock, MinusCircle } from 'lucide-react';
import { ModalSheet } from '../components/ModalSheet';
import { useToast } from '../components/Toast';
import { dbService, type Expense } from '../services/dbService';
import { NotificationBell } from '../components/notifications/NotificationBell';

interface FinancesProps {
  unreadCount: number;
  onOpenNotif: () => void;
}

export const Finances: React.FC<FinancesProps> = ({ unreadCount, onOpenNotif }) => {
  const { showToast } = useToast();

  const [summary, setSummary] = useState({ totalRevenue: 0, pendingPayments: 0, totalExpenses: 0, netProfit: 0 });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', notes: '' });

  const fetchData = async () => {
    try {
      const fin = await dbService.getFinances();
      setSummary(fin.summary);
      setExpenses(fin.expenses);
    } catch { showToast('Error loading finances', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.amount) { showToast('Title and amount required', 'warning'); return; }
    try {
      await dbService.addExpense({ title: form.title, amount: Number(form.amount), notes: form.notes });
      showToast('Expense logged', 'success');
      setIsAddOpen(false);
      setForm({ title: '', amount: '', notes: '' });
      fetchData();
    } catch { showToast('Failed to save expense', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this expense?')) return;
    try {
      await dbService.deleteExpense(id);
      showToast('Expense removed', 'success');
      fetchData();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const netPositive = summary.netProfit >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '2px' }}>Business</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Ledger</h1>
        </div>
        <NotificationBell unreadCount={unreadCount} onClick={onOpenNotif} />
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '88px', borderRadius: '18px' }} />)}
        </div>
      ) : (
        <>
          {/* Net Profit Hero */}
          <div className="glass-card" style={{ padding: '20px', background: netPositive ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)', border: `1px solid ${netPositive ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Net Profit</div>
            <div style={{ fontSize: '34px', fontWeight: 800, color: netPositive ? 'var(--success)' : 'var(--danger)', letterSpacing: '-0.02em' }}>
              {netPositive ? '+' : '-'}₨{Math.abs(summary.netProfit).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Revenue minus expenses</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Revenue', value: summary.totalRevenue, icon: TrendingUp, color: 'var(--success)' },
              { label: 'Pending', value: summary.pendingPayments, icon: Clock, color: 'var(--warning)' },
              { label: 'Expenses', value: summary.totalExpenses, icon: MinusCircle, color: 'var(--danger)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass-card" style={{ padding: '14px' }}>
                <Icon size={14} color={color} strokeWidth={2} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '16px', fontWeight: 800, color }}> ₨{value.toLocaleString()}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Expenses Ledger */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span className="section-label">Shop Expenses</span>
          <button onClick={() => setIsAddOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '10px', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
            <Plus size={13} /> Add
          </button>
        </div>

        {loading ? (
          [0,1].map(i => <div key={i} className="skeleton" style={{ height: '64px', borderRadius: '14px', marginBottom: '8px' }} />)
        ) : expenses.length === 0 ? (
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
            <IndianRupee size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No expenses logged yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {expenses.map(exp => (
              <div key={exp.id} className="glass-card" style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MinusCircle size={16} color="var(--danger)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{exp.title}</div>
                  {exp.notes && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{exp.notes}</div>}
                  {exp.created_at && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{new Date(exp.created_at).toLocaleDateString()}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--danger)' }}>₨{exp.amount.toLocaleString()}</div>
                  <button onClick={() => handleDelete(exp.id)} style={{ marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Sheet */}
      <ModalSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Expense">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Expense Title *</label>
            <input className="glass-input" placeholder="e.g. Thread purchase, Electricity bill" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Amount (₨) *</label>
            <input className="glass-input" type="number" placeholder="0" inputMode="numeric" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes</label>
            <textarea className="glass-input" rows={2} placeholder="Optional details…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'none' }} />
          </div>
          <button className="glass-btn glass-btn-primary glass-btn-full" onClick={handleAdd}>Log Expense</button>
        </div>
      </ModalSheet>
    </div>
  );
};
