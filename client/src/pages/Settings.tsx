import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Database, Cloud, Trash2, AlertTriangle, Sun, Moon } from 'lucide-react';
import { dbService } from '../services/dbService';

const SHOP_NAME_KEY = 'rt_shop_name';

export const Settings: React.FC = () => {
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);
  const [cloudinaryOk, setCloudinaryOk] = useState<boolean>(false);
  const [shopName, setShopName] = useState(localStorage.getItem(SHOP_NAME_KEY) || 'Royal Tailor');
  const [nameSaved, setNameSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('rt_theme') as 'dark' | 'light') || 'dark'
  );

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('rt_theme', newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };


  useEffect(() => {
    // Check Supabase
    setSupabaseOk(dbService.isConfigured());

    // Check Cloudinary config
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    setCloudinaryOk(!!(cloudName && preset));
  }, []);

  const saveShopName = () => {
    localStorage.setItem(SHOP_NAME_KEY, shopName);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const resetLocalData = () => {
    ['rt_customers', 'rt_measurements', 'rt_orders', 'rt_expenses'].forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  const StatusRow: React.FC<{ label: string; sub: string; ok: boolean | null; icon: React.ReactNode }> = ({ label, sub, ok, icon }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '10px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>
      </div>
      <div>
        {ok === null ? (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Checking…</span>
        ) : ok ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: 'var(--success)' }}>
            <CheckCircle2 size={16} /> Active
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
            <XCircle size={16} /> Not Set
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div>
        <div className="section-label" style={{ marginBottom: '2px' }}>Configuration</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
      </div>

      {/* Shop Name */}
      <div>
        <span className="section-label" style={{ marginBottom: '10px', display: 'block' }}>Shop Identity</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            className="glass-input"
            value={shopName}
            onChange={e => setShopName(e.target.value)}
            placeholder="Shop name"
            style={{ flex: 1 }}
          />
          <button
            onClick={saveShopName}
            style={{ padding: '12px 18px', borderRadius: '12px', background: nameSaved ? 'rgba(52,211,153,0.12)' : 'rgba(201,169,110,0.12)', border: `1px solid ${nameSaved ? 'rgba(52,211,153,0.25)' : 'rgba(201,169,110,0.25)'}`, color: nameSaved ? 'var(--success)' : 'var(--accent-gold)', cursor: 'pointer', fontSize: '13px', fontWeight: 700, transition: 'all 0.2s ease' }}
          >
            {nameSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* App Theme */}
      <div>
        <span className="section-label" style={{ marginBottom: '10px', display: 'block' }}>App Theme</span>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '4px' }}>
          <button
            onClick={() => handleThemeChange('dark')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              background: theme === 'dark' ? 'var(--text-primary)' : 'transparent',
              color: theme === 'dark' ? 'var(--bg-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Moon size={16} /> Dark Mode
          </button>
          <button
            onClick={() => handleThemeChange('light')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '12px',
              border: 'none',
              background: theme === 'light' ? 'var(--text-primary)' : 'transparent',
              color: theme === 'light' ? 'var(--bg-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Sun size={16} /> Light Mode
          </button>
        </div>
      </div>

      {/* Integration Status */}
      <div>
        <span className="section-label" style={{ marginBottom: '10px', display: 'block' }}>Integrations</span>

        <StatusRow
          label="Supabase Database"
          sub={supabaseOk ? 'PostgreSQL connected · data synced' : 'Not configured · using local storage'}
          ok={supabaseOk}
          icon={<Database size={18} color={supabaseOk ? 'var(--success)' : 'var(--text-muted)'} />}
        />

        <StatusRow
          label="Cloudinary Storage"
          sub={cloudinaryOk ? 'Image upload active · CDN enabled' : 'Not configured · images won\'t persist'}
          ok={cloudinaryOk}
          icon={<Cloud size={18} color={cloudinaryOk ? 'var(--accent-blue)' : 'var(--text-muted)'} />}
        />
      </div>

      {/* Setup Guide */}
      {(!supabaseOk || !cloudinaryOk) && (
        <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--warning)', marginBottom: '10px' }}>Setup Required</div>
          {!supabaseOk && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.6 }}>
              <strong>Supabase:</strong> Add <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> and <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code> to <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>client/.env</code>
            </div>
          )}
          {!cloudinaryOk && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong>Cloudinary:</strong> Create an unsigned upload preset at cloudinary.com/console → Settings → Upload Presets, then add <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>VITE_CLOUDINARY_CLOUD_NAME</code> and <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>VITE_CLOUDINARY_UPLOAD_PRESET</code> to <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>client/.env</code>
            </div>
          )}
        </div>
      )}

      {/* Data Reset */}
      <div>
        <span className="section-label" style={{ marginBottom: '10px', display: 'block' }}>Data</span>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '14px 16px', borderRadius: '14px', background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.18)', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}
          >
            <Trash2 size={16} /> Clear Local Storage Data
          </button>
        ) : (
          <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--danger-bg)', border: '1px solid rgba(248,113,113,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--danger)', marginBottom: '12px' }}>
              <AlertTriangle size={16} /> Are you sure?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              This clears all local data. If Supabase is connected, cloud data is unaffected.
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Cancel</button>
              <button onClick={resetLocalData} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'var(--danger)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Reset</button>
            </div>
          </div>
        )}
      </div>

      {/* App Info */}
      <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Royal Tailor v2.0</div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Tailoring Management System</div>
      </div>

    </div>
  );
};
