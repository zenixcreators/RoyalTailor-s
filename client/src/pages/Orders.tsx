import React, { useEffect, useState } from 'react';
import { Search, Plus, Calendar, Edit, Trash2, X, Loader2, Camera } from 'lucide-react';
import { ModalSheet } from '../components/ModalSheet';
import { useToast } from '../components/Toast';
import { dbService, type Order, type Customer } from '../services/dbService';
import { NotificationBell } from '../components/notifications/NotificationBell';

interface OrdersProps {
  onOpenWizard: () => void;
  unreadCount: number;
  onOpenNotif: () => void;
}

type Status = 'Received' | 'Cutting' | 'Stitching' | 'Ready' | 'Delivered';
const STATUSES: Status[] = ['Received', 'Cutting', 'Stitching', 'Ready', 'Delivered'];


const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

async function uploadImage(file: File): Promise<string> {
  if (CLOUDINARY_CLOUD && CLOUDINARY_PRESET) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
      { method: 'POST', body: fd }
    );
    const json = await res.json();
    if (json.secure_url) return json.secure_url;
  }
  return URL.createObjectURL(file);
}

export const Orders: React.FC<OrdersProps> = ({ onOpenWizard, unreadCount, onOpenNotif }) => {
  const { showToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Partial<Order>>({});
  const [uploading, setUploading] = useState(false);
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [o, c] = await Promise.all([dbService.getOrders(), dbService.getCustomers()]);
      setOrders(o);
      setCustomers(c);
    } catch { showToast('Error loading orders', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const custName = (id: string) => customers.find(c => c.id === id)?.name ?? 'Customer';

  const filtered = orders
    .filter(o => filter === 'All' || o.status === filter)
    .filter(o =>
      custName(o.customer_id).toLowerCase().includes(search.toLowerCase()) ||
      o.cloth_type.toLowerCase().includes(search.toLowerCase())
    );

  const handleStatusChange = async (order: Order, status: Status) => {
    try {
      const updated = await dbService.updateOrder(order.id, { status });
      if (detailOrder?.id === order.id) setDetailOrder(updated);
      showToast(`Status → ${status}`, 'success');
      fetchData();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await dbService.deleteOrder(id);
      showToast('Order deleted', 'success');
      setIsDetailOpen(false);
      fetchData();
    } catch { showToast('Failed to delete', 'error'); }
  };

  const openEdit = (order: Order) => {
    setEditOrder({ ...order });
    setIsDetailOpen(false);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editOrder.id) return;
    try {
      await dbService.updateOrder(editOrder.id, editOrder);
      showToast('Order updated', 'success');
      setIsEditOpen(false);
      fetchData();
    } catch { showToast('Failed to save', 'error'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setEditOrder(prev => ({ ...prev, reference_images: [...(prev.reference_images || []), url] }));
    } catch { showToast('Upload failed', 'error'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const statusIdx = (s: string) => STATUSES.indexOf(s as Status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '2px' }}>Production</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Stitching Jobs</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>{filtered.length} jobs</span>
          <NotificationBell unreadCount={unreadCount} onClick={onOpenNotif} />
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '14px' }} />
        <input className="glass-input" placeholder="Search customer or garment…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '38px' }} />
      </div>

      {/* Status Filter */}
      <div className="status-track-slider" style={{ marginBottom: '16px' }}>
        {['All', ...STATUSES].map(s => (
          <div key={s} className={`status-track-node ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</div>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        [0, 1, 2].map(i => <div key={i} className="skeleton skeleton-card" />)
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>✂️</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No jobs in "{filter}"</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(order => {
            const idx = statusIdx(order.status);
            return (
              <div
                key={order.id}
                className="glass-card glass-card-hover"
                onClick={() => { setDetailOrder(order); setIsDetailOpen(true); }}
                style={{ cursor: 'pointer', padding: '15px 16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{custName(order.customer_id)}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{order.cloth_type}</div>
                  </div>
                  <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                  {STATUSES.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= idx ? (order.status === 'Delivered' ? 'var(--success)' : 'var(--accent-gold)') : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} />{order.delivery_date}</span>
                  <span style={{ fontWeight: 700, color: order.remaining_amount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {order.remaining_amount > 0 ? `₨${order.remaining_amount.toLocaleString()} due` : '✓ Paid'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={onOpenWizard} aria-label="New Order">
        <Plus size={22} color="#1a1205" />
      </button>

      {/* ── Detail Sheet ── */}
      <ModalSheet isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Order Details">
        {detailOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{custName(detailOrder.customer_id)}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{detailOrder.cloth_type}</div>
              </div>
              <span className={`status-badge status-${detailOrder.status.toLowerCase()}`}>{detailOrder.status}</span>
            </div>

            {/* Status switcher */}
            <div>
              <span className="section-label" style={{ marginBottom: '8px', display: 'block' }}>Update Stage</span>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(detailOrder, s)} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: detailOrder.status === s ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.06)', color: detailOrder.status === s ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="glass-card" style={{ padding: '14px' }}>
              <div className="info-row"><span className="info-row-label">Delivery Date</span><span className="info-row-value">{detailOrder.delivery_date}</span></div>
              <div className="info-row"><span className="info-row-label">Total</span><span className="info-row-value">₨{detailOrder.total_amount.toLocaleString()}</span></div>
              <div className="info-row"><span className="info-row-label">Advance</span><span className="info-row-value" style={{ color: 'var(--success)' }}>₨{detailOrder.advance_amount.toLocaleString()}</span></div>
              <div className="info-row" style={{ borderBottom: 'none' }}><span className="info-row-label">Balance</span><span className="info-row-value" style={{ color: detailOrder.remaining_amount > 0 ? 'var(--danger)' : 'var(--success)' }}>₨{detailOrder.remaining_amount.toLocaleString()}</span></div>
            </div>

            {/* Reference images */}
            {detailOrder.reference_images?.length > 0 && (
              <div>
                <span className="section-label" style={{ marginBottom: '8px', display: 'block' }}>Cloth References</span>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                  {detailOrder.reference_images.map((u, i) => (
                    <div key={i} onClick={() => setFullscreenImg(u)} style={{ flexShrink: 0, width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={u} alt="ref" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="glass-btn glass-btn-primary" style={{ flex: 1 }} onClick={() => openEdit(detailOrder)}><Edit size={14} /> Edit</button>
              <button className="glass-btn glass-btn-danger" style={{ padding: '13px 16px' }} onClick={() => handleDelete(detailOrder.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        )}
      </ModalSheet>

      {/* ── Edit Sheet ── */}
      <ModalSheet isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Order">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Garment Description</label>
            <input className="glass-input" value={editOrder.cloth_type || ''} onChange={e => setEditOrder(p => ({ ...p, cloth_type: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Total (₨)</label>
              <input className="glass-input" type="number" value={editOrder.total_amount || ''} onChange={e => setEditOrder(p => ({ ...p, total_amount: Number(e.target.value) }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Advance (₨)</label>
              <input className="glass-input" type="number" value={editOrder.advance_amount || ''} onChange={e => setEditOrder(p => ({ ...p, advance_amount: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Delivery Date</label>
            <input className="glass-input" type="date" value={editOrder.delivery_date || ''} onChange={e => setEditOrder(p => ({ ...p, delivery_date: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="glass-input glass-select" value={editOrder.status || 'Received'} onChange={e => setEditOrder(p => ({ ...p, status: e.target.value }))}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Add images in edit */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Cloth Photos</label>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(editOrder.reference_images || []).map((u, i) => (
                <div key={i} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={u} alt="ref" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setEditOrder(p => ({ ...p, reference_images: (p.reference_images || []).filter((_, j) => j !== i) }))} style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: '64px', height: '64px', borderRadius: '10px', border: '1.5px dashed rgba(201,169,110,0.35)', background: 'rgba(201,169,110,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                {uploading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={18} />}
              </button>
            </div>
          </div>

          <button className="glass-btn glass-btn-primary glass-btn-full" onClick={handleSaveEdit}>Save Changes</button>
        </div>
      </ModalSheet>

      {/* Fullscreen image viewer */}
      {fullscreenImg && (
        <div onClick={() => setFullscreenImg(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }}>
          <button onClick={() => setFullscreenImg(null)} style={{ position: 'absolute', top: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
          <img src={fullscreenImg} alt="preview" style={{ maxWidth: '92%', maxHeight: '82%', objectFit: 'contain', borderRadius: '12px' }} />
        </div>
      )}
    </div>
  );
};
