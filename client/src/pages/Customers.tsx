import React, { useEffect, useState } from 'react';
import { Search, Phone, MapPin, ChevronDown, ChevronUp, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { ModalSheet } from '../components/ModalSheet';
import { useToast } from '../components/Toast';
import { dbService, type Customer } from '../services/dbService';
import { NotificationBell } from '../components/notifications/NotificationBell';

interface CustomersProps {
  unreadCount: number;
  onOpenNotif: () => void;
}

export const Customers: React.FC<CustomersProps> = ({ unreadCount, onOpenNotif }) => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>({ name: '', phone: '', address: '', notes: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [cs, orders] = await Promise.all([dbService.getCustomers(), dbService.getOrders()]);
      setCustomers(cs);
      const counts: Record<string, number> = {};
      orders.forEach(o => { counts[o.customer_id] = (counts[o.customer_id] || 0) + 1; });
      setOrderCounts(counts);
    } catch { showToast('Error loading customers', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const openEdit = (c: Customer, e: React.MouseEvent) => { e.stopPropagation(); setForm(c); setIsFormOpen(true); };
  const openDelete = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setDeleteId(id); setIsDeleteOpen(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) { showToast('Name is required', 'warning'); return; }
    try {
      if (form.id) {
        await dbService.updateCustomer(form.id, form);
        showToast('Customer updated', 'success');
      } else {
        await dbService.addCustomer({ name: form.name!, phone: form.phone || '', address: form.address || '', notes: form.notes || '' });
        showToast('Customer added', 'success');
      }
      setIsFormOpen(false);
      fetchData();
    } catch { showToast('Failed to save', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await dbService.deleteCustomer(deleteId);
      showToast('Customer removed', 'success');
      setIsDeleteOpen(false);
      setExpandedId(null);
      fetchData();
    } catch { showToast('Failed to delete', 'error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '2px' }}>Directory</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Clients</h1>
        </div>
        <NotificationBell unreadCount={unreadCount} onClick={onOpenNotif} />
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '14px' }} />
        <input className="glass-input" placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
      </div>

      {/* List */}
      {loading ? (
        [0, 1, 2].map(i => <div key={i} className="skeleton skeleton-card" style={{ marginBottom: '10px' }} />)
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>👤</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No clients yet</div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>Start a "New Stitching" order to add a client</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(c => {
            const expanded = expandedId === c.id;
            const orderCount = orderCounts[c.id] || 0;
            return (
              <div key={c.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Customer row */}
                <div
                  onClick={() => setExpandedId(expanded ? null : c.id)}
                  style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', gap: '12px' }}
                >
                  {/* Avatar */}
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--accent-gold)' }}>{c.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.phone || 'No phone'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {orderCount > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-gold)', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.2)', padding: '3px 8px', borderRadius: '10px' }}>
                        {orderCount} {orderCount === 1 ? 'order' : 'orders'}
                      </span>
                    )}
                    {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {c.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <Phone size={13} color="var(--text-muted)" />{c.phone}
                        </div>
                      )}
                      {c.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <MapPin size={13} color="var(--text-muted)" />{c.address}
                        </div>
                      )}
                      {c.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '10px', lineHeight: 1.5 }}>
                          {c.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button onClick={e => openEdit(c, e)} className="glass-btn glass-btn-secondary" style={{ flex: 1, padding: '10px' }}>
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={e => openDelete(c.id, e)} className="glass-btn glass-btn-danger" style={{ padding: '10px 16px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Sheet */}
      <ModalSheet isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={form.id ? 'Edit Client' : 'Add Client'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Name *</label>
            <input className="glass-input" placeholder="Full name" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone</label>
            <input className="glass-input" type="tel" placeholder="Phone number" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Address</label>
            <input className="glass-input" placeholder="Address" value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Notes</label>
            <textarea className="glass-input" rows={2} placeholder="Any special notes…" value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'none' }} />
          </div>
          <button className="glass-btn glass-btn-primary glass-btn-full" onClick={handleSave}>
            {form.id ? 'Update Client' : 'Add Client'}
          </button>
        </div>
      </ModalSheet>

      {/* Delete Confirm */}
      <ModalSheet isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Client">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} color="var(--danger)" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Remove Client?</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>This will also remove all associated orders and measurements.</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button className="glass-btn glass-btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteOpen(false)}>Cancel</button>
            <button className="glass-btn glass-btn-danger" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </ModalSheet>
    </div>
  );
};
