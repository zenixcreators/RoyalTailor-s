import React, { useState, useRef } from 'react';
import {
  X, ChevronLeft, ChevronRight, Check,
  User, Phone, MapPin, Camera,
  IndianRupee, Plus, Minus,
  Loader2, Info
} from 'lucide-react';
import { useToast } from './Toast';
import { dbService, type Measurements } from '../services/dbService';

// ─── Types ───────────────────────────────────────────────────────────────────
interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ClothItem { type: string; qty: number; }

interface WizardData {
  // Step 1
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes: string;
  isExistingCustomer: boolean;
  // Step 2
  clothingItems: ClothItem[];
  orderNotes: string;
  // Step 3
  referenceImages: string[];
  // Step 4
  totalAmount: string;
  advanceAmount: string;
  deliveryDate: string;
  // Step 5
  measurements: Partial<Measurements>;
}

const CLOTHING_TYPES = [
  { label: 'Shirt', emoji: '👔' },
  { label: 'Pant', emoji: '👖' },
  { label: 'Suit', emoji: '🤵' },
  { label: 'Kurta', emoji: '🩱' },
  { label: 'Blazer', emoji: '🧥' },
  { label: 'Combo Set', emoji: '✨' },
];

const STEP_LABELS = [
  'Customer', 'Clothing', 'Photos', 'Billing', 'Measurements', 'Summary'
];

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

// Contextual measurement guides with high-end tailored instruction and illustration mappings
export const MEASUREMENT_GUIDES: Record<string, { label: string; instruction: string; pathHighlight: string }> = {
  shoulder: { label: 'Shoulder', instruction: 'Measure horizontally from the outer edge of one shoulder seam to the other.', pathHighlight: 'shoulder' },
  chest: { label: 'Chest', instruction: 'Measure horizontally around the fullest part of the chest, keeping the tape level.', pathHighlight: 'chest' },
  waist: { label: 'Waist', instruction: 'Measure horizontally around the natural waistline, where trouser waistband sits.', pathHighlight: 'waist' },
  hip: { label: 'Hip', instruction: 'Measure horizontally around the fullest part of the seat/hips.', pathHighlight: 'hip' },
  sleeve_length: { label: 'Sleeve Length', instruction: 'Measure from the shoulder seam down to the wrist bone.', pathHighlight: 'sleeve_length' },
  arm_length: { label: 'Arm Length', instruction: 'Measure from collar seam, down the shoulder, and down to the wrist bone.', pathHighlight: 'sleeve_length' },
  collar: { label: 'Collar', instruction: 'Measure around the neck at the base where the shirt collar sits.', pathHighlight: 'collar' },
  neck: { label: 'Neck', instruction: 'Measure comfortably around the base of the neck, leaving a two-finger gap.', pathHighlight: 'collar' },
  cuff: { label: 'Cuff', instruction: 'Measure around the wrist, adding comfort ease for dress shirt cuffs.', pathHighlight: 'sleeve_length' },
  across_back: { label: 'Across Back', instruction: 'Measure horizontally across the back from one armhole seam to the other.', pathHighlight: 'shoulder' },
  inseam: { label: 'Inseam', instruction: 'Measure the inside leg from the crotch point down to the ankle bone.', pathHighlight: 'inseam' },
  outseam: { label: 'Outseam', instruction: 'Measure the outside leg from the natural waist down to the shoe sole.', pathHighlight: 'pant_length' },
  thigh: { label: 'Thigh', instruction: 'Measure around the fullest part of the upper thigh.', pathHighlight: 'inseam' },
  knee: { label: 'Knee', instruction: 'Measure around the knee joint at a comfortable standing posture.', pathHighlight: 'pant_length' },
  bottom_width: { label: 'Bottom Width', instruction: 'Measure the desired leg opening width at the cuff hem.', pathHighlight: 'pant_length' },
  pant_length: { label: 'Pant Length', instruction: 'Measure from trouser waistline down to the desired leg hem.', pathHighlight: 'pant_length' },
  height: { label: 'Height', instruction: 'Measure the total body height from crown to sole in centimeters.', pathHighlight: 'collar' },
  weight: { label: 'Weight', instruction: 'Measure the body weight in kilograms.', pathHighlight: 'collar' },
};

// Numeric fields sequence to allow smooth keypad Prev/Next tab navigation
export const NUMERIC_MEASUREMENT_FIELDS: Array<{ label: string; field: keyof Measurements; group: 'upper' | 'lower' }> = [
  { label: 'Shoulder', field: 'shoulder', group: 'upper' },
  { label: 'Chest', field: 'chest', group: 'upper' },
  { label: 'Waist', field: 'waist', group: 'upper' },
  { label: 'Hip', field: 'hip', group: 'upper' },
  { label: 'Sleeve Length', field: 'sleeve_length', group: 'upper' },
  { label: 'Arm Length', field: 'arm_length', group: 'upper' },
  { label: 'Collar', field: 'collar', group: 'upper' },
  { label: 'Neck', field: 'neck', group: 'upper' },
  { label: 'Cuff', field: 'cuff', group: 'upper' },
  { label: 'Across Back', field: 'across_back', group: 'upper' },
  { label: 'Inseam', field: 'inseam', group: 'lower' },
  { label: 'Outseam', field: 'outseam', group: 'lower' },
  { label: 'Thigh', field: 'thigh', group: 'lower' },
  { label: 'Knee', field: 'knee', group: 'lower' },
  { label: 'Bottom Width', field: 'bottom_width', group: 'lower' },
  { label: 'Pant Length', field: 'pant_length', group: 'lower' },
  { label: 'Height', field: 'height', group: 'lower' },
  { label: 'Weight', field: 'weight', group: 'lower' },
];

export const BodySilhouette: React.FC<{ activePart: string; onPartTap?: (part: string) => void }> = ({ activePart, onPartTap }) => {
  return (
    <svg viewBox="0 0 100 180" style={{ width: '100%', height: '100%', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', transition: 'all 0.3s ease' }}>
      <defs>
        {/* Glow effect for selected active 3D part */}
        <filter id="3d-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Realistic volumetric shading for the tailor's dress form canvas */}
        <linearGradient id="torso-3d-shading" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--bg-secondary)" />
          <stop offset="25%" stopColor="var(--glass-bg-strong)" />
          <stop offset="60%" stopColor="var(--bg-elevated)" />
          <stop offset="90%" stopColor="var(--bg-primary)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--bg-secondary)" />
        </linearGradient>

        {/* Polished mahogany wood cap and base pedestal stand trim */}
        <linearGradient id="premium-trim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#854d0e" />
          <stop offset="50%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>

        {/* Polished heavy metal pole stand */}
        <linearGradient id="metal-pole" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="40%" stopColor="#e2e8f0" />
          <stop offset="60%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* ── Polished Metal Pedestal Pole & Tripod Base ── */}
      <rect x="49" y="112" width="2" height="56" fill="url(#metal-pole)" />
      
      {/* Curved 3D Tripod Legs base */}
      <path d="M49 162 C43 166 32 173 24 174 C23 174 23 175 24 175 C34 174 44 168 49 164" fill="url(#premium-trim)" />
      <path d="M51 162 C57 166 68 173 76 174 C77 174 77 175 76 175 C66 174 56 168 51 164" fill="url(#premium-trim)" />
      <path d="M50 162 C50 167 50 174 50 176 C48 176 48 177 50 177 C52 177 52 176 50 176" fill="url(#premium-trim)" />
      
      {/* Polished mahogany wood collar joint spacer at base of torso */}
      <ellipse cx="50" cy="113" rx="14" ry="4" fill="url(#premium-trim)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />

      {/* ── Volumetric Torso Body core ── */}
      <path 
        d="M30 44 Q50 36 70 44 C76 58 72 70 69 76 C66 90 64 102 64 112 C58 116 42 116 36 112 C36 102 34 90 31 76 C28 70 24 58 30 44 Z" 
        fill="url(#torso-3d-shading)" 
        stroke="var(--glass-border-strong)"
        strokeWidth="1"
      />

      {/* Volumetric vertical mesh lines */}
      <path d="M43 41 Q50 64 45 113" stroke="var(--glass-border)" strokeWidth="0.8" />
      <path d="M57 41 Q50 64 55 113" stroke="var(--glass-border)" strokeWidth="0.8" />
      <path d="M50 38 L50 114" stroke="var(--glass-border)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />

      {/* ── Wood Neck Finial ── */}
      <path d="M46 22 L46 36 L54 36 L54 22 Z" fill="url(#premium-trim)" />
      <ellipse cx="50" cy="22" rx="6.5" ry="3" fill="url(#premium-trim)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
      <circle cx="50" cy="16" r="3.5" fill="url(#premium-trim)" />

      {/* ── Interactive 3D Guideline hot zones ── */}

      {/* Collar */}
      <path 
        d="M44 32 C46 36 54 36 56 32" 
        style={{
          stroke: activePart === 'collar' || activePart === 'neck' ? 'var(--success)' : 'var(--text-muted)',
          strokeWidth: activePart === 'collar' || activePart === 'neck' ? 3.5 : 1.5,
          filter: activePart === 'collar' || activePart === 'neck' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('collar')}
      />
      
      {/* Shoulder */}
      <path 
        d="M30 44 Q50 38 70 44" 
        style={{
          stroke: activePart === 'shoulder' || activePart === 'across_back' ? 'var(--success)' : 'var(--text-muted)',
          strokeWidth: activePart === 'shoulder' || activePart === 'across_back' ? 4 : 1.5,
          filter: activePart === 'shoulder' || activePart === 'across_back' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('shoulder')}
      />

      {/* Chest */}
      <path 
        d="M30 62 Q50 69 70 62" 
        style={{
          stroke: activePart === 'chest' ? 'var(--success)' : 'var(--text-muted)',
          strokeWidth: activePart === 'chest' ? 4 : 1.5,
          filter: activePart === 'chest' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('chest')}
      />

      {/* Waist */}
      <path 
        d="M33 84 Q50 89 67 84" 
        style={{
          stroke: activePart === 'waist' ? 'var(--success)' : 'var(--text-muted)',
          strokeWidth: activePart === 'waist' ? 4 : 1.5,
          filter: activePart === 'waist' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('waist')}
      />

      {/* Hip */}
      <path 
        d="M35 102 Q50 106 65 102" 
        style={{
          stroke: activePart === 'hip' ? 'var(--success)' : 'var(--text-muted)',
          strokeWidth: activePart === 'hip' ? 4 : 1.5,
          filter: activePart === 'hip' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('hip')}
      />

      {/* Sleeves (Left & Right) */}
      <path 
        d="M27 46 C21 64 18 84 21 102" 
        style={{
          stroke: activePart === 'sleeve_length' || activePart === 'arm_length' || activePart === 'cuff' ? 'var(--success)' : 'var(--text-dim)',
          strokeWidth: activePart === 'sleeve_length' || activePart === 'arm_length' || activePart === 'cuff' ? 4 : 1.5,
          filter: activePart === 'sleeve_length' || activePart === 'arm_length' || activePart === 'cuff' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('sleeve_length')}
      />
      <path 
        d="M73 46 C79 64 82 84 79 102" 
        style={{
          stroke: activePart === 'sleeve_length' || activePart === 'arm_length' || activePart === 'cuff' ? 'var(--success)' : 'var(--text-dim)',
          strokeWidth: activePart === 'sleeve_length' || activePart === 'arm_length' || activePart === 'cuff' ? 4 : 1.5,
          filter: activePart === 'sleeve_length' || activePart === 'arm_length' || activePart === 'cuff' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('sleeve_length')}
      />

      {/* Pant Length / Outseam */}
      <path 
        d="M33 118 L26 166" 
        style={{
          stroke: activePart === 'pant_length' || activePart === 'outseam' || activePart === 'knee' || activePart === 'bottom_width' ? 'var(--success)' : 'var(--text-dim)',
          strokeWidth: activePart === 'pant_length' || activePart === 'outseam' || activePart === 'knee' || activePart === 'bottom_width' ? 4 : 1.5,
          filter: activePart === 'pant_length' || activePart === 'outseam' || activePart === 'knee' || activePart === 'bottom_width' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('pant_length')}
      />
      <path 
        d="M67 118 L74 166" 
        style={{
          stroke: activePart === 'pant_length' || activePart === 'outseam' || activePart === 'knee' || activePart === 'bottom_width' ? 'var(--success)' : 'var(--text-dim)',
          strokeWidth: activePart === 'pant_length' || activePart === 'outseam' || activePart === 'knee' || activePart === 'bottom_width' ? 4 : 1.5,
          filter: activePart === 'pant_length' || activePart === 'outseam' || activePart === 'knee' || activePart === 'bottom_width' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('pant_length')}
      />

      {/* Inseam */}
      <path 
        d="M44 122 L41 166" 
        style={{
          stroke: activePart === 'inseam' || activePart === 'thigh' ? 'var(--success)' : 'var(--text-dim)',
          strokeWidth: activePart === 'inseam' || activePart === 'thigh' ? 4 : 1.5,
          filter: activePart === 'inseam' || activePart === 'thigh' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('inseam')}
      />
      <path 
        d="M56 122 L59 166" 
        style={{
          stroke: activePart === 'inseam' || activePart === 'thigh' ? 'var(--success)' : 'var(--text-dim)',
          strokeWidth: activePart === 'inseam' || activePart === 'thigh' ? 4 : 1.5,
          filter: activePart === 'inseam' || activePart === 'thigh' ? 'url(#3d-glow)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onClick={() => onPartTap?.('inseam')}
      />
    </svg>
  );
};

const emptyWizard = (): WizardData => ({
  customerId: '',
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  customerNotes: '',
  isExistingCustomer: false,
  clothingItems: [],
  orderNotes: '',
  referenceImages: [],
  totalAmount: '',
  advanceAmount: '',
  deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  measurements: {},
});

// ─── Upload to Cloudinary or fallback ────────────────────────────────────────
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const MeasRow: React.FC<{
  label: string;
  field: keyof Measurements;
  unit?: string;
  data: Partial<Measurements>;
  activeField: keyof Measurements | null;
  onFocus: (f: keyof Measurements) => void;
  onInfo: (f: keyof Measurements) => void;
}> = ({ label, field, unit = 'in', data, activeField, onFocus, onInfo }) => {
  const active = activeField === field;
  const val = (data as Record<string, unknown>)?.[field] as number || 0;
  const displayVal = val === 0 ? '' : val.toString();

  return (
    <div 
      onClick={() => onFocus(field)}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '12px 14px', 
        borderRadius: '14px',
        marginBottom: '6px', 
        gap: '12px',
        background: active ? 'rgba(52, 211, 153, 0.05)' : 'var(--glass-bg)',
        border: `1.5px solid ${active ? 'var(--success)' : 'var(--glass-border)'}`,
        boxShadow: active ? '0 0 12px rgba(52, 211, 153, 0.08)' : 'none',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
      className="glass-card-hover"
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: active ? 700 : 500 }}>
          {label}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onInfo(field); }}
          style={{
            background: 'none',
            border: 'none',
            color: active ? 'var(--success)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: active ? 1 : 0.5,
            transition: 'all 0.15s ease'
          }}
        >
          <Info size={13} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: '84px',
            height: '38px',
            background: active ? 'var(--bg-secondary)' : 'var(--glass-bg-elevated)',
            border: `1px solid ${active ? 'var(--success)' : 'var(--glass-border-strong)'}`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: 800,
            color: displayVal ? 'var(--text-primary)' : 'var(--text-dim)',
            transition: 'all 0.15s ease'
          }}
        >
          {displayVal || '0'}
        </div>
        <span style={{ fontSize: '11px', color: active ? 'var(--text-secondary)' : 'var(--text-muted)', width: '16px', fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  );
};

// ─── Main Wizard Component ────────────────────────────────────────────────────
export const NewOrderWizard: React.FC<WizardProps> = ({ isOpen, onClose, onComplete }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(emptyWizard());
  const [existingCustomers, setExistingCustomers] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [custSearch, setCustSearch] = useState('');
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [measSection, setMeasSection] = useState<'upper' | 'lower' | 'notes'>('upper');
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  const [activeField, setActiveField] = useState<keyof Measurements | null>(null);
  const [typedValue, setTypedValue] = useState<string>('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Load customers when wizard opens
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setData(emptyWizard());
      setCustSearch('');
      setShowSuccessCard(false);
      setActiveField(null);
      setTypedValue('');
      setIsGuideOpen(false);
      dbService.getCustomers().then(cs =>
        setExistingCustomers(cs.map(c => ({ id: c.id, name: c.name, phone: c.phone })))
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const setField = <K extends keyof WizardData>(k: K, v: WizardData[K]) =>
    setData(d => ({ ...d, [k]: v }));

  const setMeas = (f: keyof Measurements, v: string) =>
    setData(d => ({ ...d, measurements: { ...d.measurements, [f]: v === '' ? 0 : Number(v) } }));

  const handleKeypadPress = (val: string) => {
    if (!activeField) return;

    let current = typedValue;
    if (val === 'clear') {
      current = '';
    } else if (val === 'backspace') {
      current = current.slice(0, -1);
    } else if (val === '1/2') {
      const intPart = parseInt(current) || 0;
      current = `${intPart}.5`;
    } else if (val === '1/4') {
      const intPart = parseInt(current) || 0;
      current = `${intPart}.25`;
    } else {
      if (val === '.' && current.includes('.')) return;
      current += val;
    }

    setTypedValue(current);
    setMeas(activeField, current);
  };

  const handleKeypadNav = (dir: 'prev' | 'next') => {
    if (!activeField) {
      const first = NUMERIC_MEASUREMENT_FIELDS[0];
      setActiveField(first.field);
      const val = data.measurements[first.field];
      setTypedValue(val && val !== 0 ? val.toString() : '');
      return;
    }
    const idx = NUMERIC_MEASUREMENT_FIELDS.findIndex(item => item.field === activeField);
    if (idx === -1) return;

    let nextIdx = idx + (dir === 'next' ? 1 : -1);
    if (nextIdx >= NUMERIC_MEASUREMENT_FIELDS.length) {
      nextIdx = 0;
    } else if (nextIdx < 0) {
      nextIdx = NUMERIC_MEASUREMENT_FIELDS.length - 1;
    }

    const targetItem = NUMERIC_MEASUREMENT_FIELDS[nextIdx];
    setActiveField(targetItem.field);
    setMeasSection(targetItem.group === 'upper' ? 'upper' : 'lower');

    const val = data.measurements[targetItem.field];
    setTypedValue(val && val !== 0 ? val.toString() : '');
  };

  const toggleClothing = (type: string) => {
    setData(d => {
      const exists = d.clothingItems.find(i => i.type === type);
      if (exists) return { ...d, clothingItems: d.clothingItems.filter(i => i.type !== type) };
      return { ...d, clothingItems: [...d.clothingItems, { type, qty: 1 }] };
    });
  };

  const changeQty = (type: string, delta: number) => {
    setData(d => ({
      ...d,
      clothingItems: d.clothingItems.map(i =>
        i.type === type ? { ...i, qty: Math.max(1, i.qty + delta) } : i
      )
    }));
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const idx = data.referenceImages.length;
    setUploadingIdx(idx);
    showToast('Uploading image…', 'info');
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setData(d => ({ ...d, referenceImages: [...d.referenceImages, ...urls] }));
      showToast('Photo uploaded', 'success');
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploadingIdx(null);
      e.target.value = '';
    }
  };

  const removeImage = (idx: number) =>
    setData(d => ({ ...d, referenceImages: d.referenceImages.filter((_, i) => i !== idx) }));

  const remaining = Math.max(0, Number(data.totalAmount) - Number(data.advanceAmount));

  // ── Validation ─────────────────────────────────────────────────────────────

  const canNext = (): boolean => {
    if (step === 1) return data.customerName.trim().length > 0;
    if (step === 2) return data.clothingItems.length > 0;
    if (step === 3) return true;
    if (step === 4) return Number(data.totalAmount) > 0 && data.deliveryDate !== '';
    if (step === 5) return true;
    return true;
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let customerId = data.customerId;

      if (!data.isExistingCustomer || !customerId) {
        const newCust = await dbService.addCustomer({
          name: data.customerName.trim(),
          phone: data.customerPhone.trim(),
          address: data.customerAddress.trim(),
          notes: data.customerNotes.trim(),
        });
        customerId = newCust.id;
      }

      const clothDesc = data.clothingItems.map(i => `${i.qty}x ${i.type}`).join(', ');
      const totalAmt = Number(data.totalAmount);
      const advAmt = Number(data.advanceAmount);

      await dbService.addOrder({
        customer_id: customerId,
        cloth_type: clothDesc,
        status: 'Received',
        delivery_date: data.deliveryDate,
        total_amount: totalAmt,
        advance_amount: advAmt,
        remaining_amount: Math.max(0, totalAmt - advAmt),
        reference_images: data.referenceImages,
        notes: data.orderNotes,
      });

      const hasAnyMeas = Object.values(data.measurements).some(v => v && v !== 0 && v !== '');
      if (hasAnyMeas) {
        await dbService.saveMeasurements(customerId, data.measurements as Omit<Measurements, 'customer_id'>);
      }

      showToast('Order saved successfully', 'success');
      onComplete();
      setShowSuccessCard(true);
    } catch (err) {
      showToast('Failed to save order', 'error');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalClose = () => {
    setShowSuccessCard(false);
    onClose();
  };

  // ── Step Content ────────────────────────────────────────────────────────────

  const filteredCustomers = existingCustomers.filter(
    c => c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
         c.phone.includes(custSearch)
  ).slice(0, 4);

  const renderStep = () => {
    switch (step) {
      // ── Step 1: Customer ─────────────────────────────────────────────────
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Search existing */}
            <div style={{ position: 'relative' }}>
              <input
                className="glass-input"
                placeholder="Search existing customer…"
                value={custSearch}
                onChange={e => setCustSearch(e.target.value)}
                style={{ paddingLeft: '14px' }}
              />
            </div>

            {custSearch && filteredCustomers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setField('customerId', c.id);
                      setField('customerName', c.name);
                      setField('customerPhone', c.phone);
                      setField('isExistingCustomer', true);
                      setCustSearch('');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', borderRadius: '14px',
                      background: data.customerId === c.id
                        ? 'rgba(26,45,66,0.06)' : 'rgba(26,45,66,0.02)',
                      border: `1px solid ${data.customerId === c.id ? 'rgba(26,45,66,0.2)' : 'rgba(26,45,66,0.06)'}`,
                      color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', width: '100%'
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(26,45,66,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} color="var(--accent-gold)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.phone}</div>
                    </div>
                    {data.customerId === c.id && <Check size={16} color="var(--accent-gold)" style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
              </div>
            )}

            {data.isExistingCustomer && data.customerName ? (
              <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Check size={16} color="var(--success)" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>{data.customerName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Existing customer selected</div>
                </div>
                <button onClick={() => { setField('customerId', ''); setField('customerName', ''); setField('isExistingCustomer', false); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>OR NEW CUSTOMER</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">Name *</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                    <input className="glass-input" placeholder="Customer name" value={data.customerName} onChange={e => { setField('customerName', e.target.value); setField('isExistingCustomer', false); setField('customerId', ''); }} style={{ paddingLeft: '38px' }} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label">Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                    <input className="glass-input" placeholder="Phone number" type="tel" value={data.customerPhone} onChange={e => setField('customerPhone', e.target.value)} style={{ paddingLeft: '38px' }} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Address</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                    <input className="glass-input" placeholder="Address (optional)" value={data.customerAddress} onChange={e => setField('customerAddress', e.target.value)} style={{ paddingLeft: '38px' }} />
                  </div>
                </div>
              </>
            )}
          </div>
        );

      // ── Step 2: Clothing ─────────────────────────────────────────────────
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {CLOTHING_TYPES.map(ct => {
                const selected = data.clothingItems.find(i => i.type === ct.label);
                return (
                  <button
                    key={ct.label}
                    className={`cloth-card ${selected ? 'selected' : ''}`}
                    onClick={() => toggleClothing(ct.label)}
                  >
                    <span style={{ fontSize: '26px' }}>{ct.emoji}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: selected ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>{ct.label}</span>
                  </button>
                );
              })}
            </div>

            {data.clothingItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span className="section-label">Selected Items</span>
                {data.clothingItems.map(item => (
                  <div key={item.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '14px', background: 'rgba(26,45,66,0.05)', border: '1px solid rgba(26,45,66,0.1)' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-gold)' }}>{item.type}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => changeQty(item.type, -1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                      <span style={{ fontWeight: 700, fontSize: '15px', minWidth: '16px', textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => changeQty(item.type, 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Order Notes (optional)</label>
              <textarea className="glass-input" placeholder="Special instructions, style preferences…" rows={2} value={data.orderNotes} onChange={e => setField('orderNotes', e.target.value)} style={{ resize: 'none' }} />
            </div>
          </div>
        );

      // ── Step 3: Photos ───────────────────────────────────────────────────
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple style={{ display: 'none' }} onChange={handleImagePick} />

            <button className="upload-zone" onClick={() => fileInputRef.current?.click()} disabled={uploadingIdx !== null}>
              {uploadingIdx !== null ? (
                <Loader2 size={28} color="var(--accent-gold)" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Camera size={28} color="var(--accent-gold)" />
              )}
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {uploadingIdx !== null ? 'Uploading…' : 'Tap to add cloth photos'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Camera or gallery · multiple allowed</span>
            </button>

            {data.referenceImages.length > 0 && (
              <div>
                <span className="section-label" style={{ marginBottom: '10px', display: 'block' }}>Cloth References ({data.referenceImages.length})</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {data.referenceImages.map((url, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={url} alt="Cloth ref" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!CLOUDINARY_CLOUD && (
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: '12px', color: 'var(--warning)' }}>
                ⚠️ Cloudinary not configured. Images stored locally (not saved after reload). Add <code>VITE_CLOUDINARY_CLOUD_NAME</code> to client/.env to enable permanent uploads.
              </div>
            )}
          </div>
        );

      // ── Step 4: Billing ──────────────────────────────────────────────────
      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Total Amount (₨)</label>
              <div style={{ position: 'relative' }}>
                <IndianRupee size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                <input className="glass-input" type="number" placeholder="0" inputMode="numeric" value={data.totalAmount} onChange={e => setField('totalAmount', e.target.value)} style={{ paddingLeft: '38px', fontSize: '20px', fontWeight: 700 }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Advance Paid (₨)</label>
              <div style={{ position: 'relative' }}>
                <IndianRupee size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '13px' }} />
                <input className="glass-input" type="number" placeholder="0" inputMode="numeric" value={data.advanceAmount} onChange={e => setField('advanceAmount', e.target.value)} style={{ paddingLeft: '38px', fontSize: '20px', fontWeight: 700 }} />
              </div>
            </div>

            {/* Auto-calculated remaining */}
            <div style={{ padding: '16px', borderRadius: '16px', background: remaining > 0 ? 'rgba(248,113,113,0.07)' : 'rgba(52,211,153,0.07)', border: `1px solid ${remaining > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Balance Remaining</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>
                ₨ {remaining.toLocaleString()}
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Delivery Date</label>
              <input className="glass-input" type="date" value={data.deliveryDate} onChange={e => setField('deliveryDate', e.target.value)} />
            </div>
          </div>
        );

      // ── Step 5: Measurements ─────────────────────────────────────────────
      case 5: {
        const activePart = activeField ? (MEASUREMENT_GUIDES[activeField]?.pathHighlight || '') : '';
        const activeInstruction = activeField ? (MEASUREMENT_GUIDES[activeField]?.instruction || '') : '';
        
        // Count fields filled in each category for live accordion progress headers
        const upperFields: (keyof Measurements)[] = ['shoulder', 'chest', 'waist', 'hip', 'sleeve_length', 'arm_length', 'collar', 'neck', 'cuff', 'across_back'];
        const lowerFields: (keyof Measurements)[] = ['inseam', 'outseam', 'thigh', 'knee', 'bottom_width', 'pant_length', 'height', 'weight'];
        
        const filledUpper = upperFields.filter(f => {
          const val = data.measurements[f];
          return val !== undefined && val !== 0 && val !== '';
        }).length;
        
        const filledLower = lowerFields.filter(f => {
          const val = data.measurements[f];
          return val !== undefined && val !== 0 && val !== '';
        }).length;

        const handleSilhouetteTap = (part: string) => {
          let targetField: keyof Measurements = 'shoulder';
          if (part === 'collar') targetField = 'collar';
          else if (part === 'chest') targetField = 'chest';
          else if (part === 'waist') targetField = 'waist';
          else if (part === 'hip') targetField = 'hip';
          else if (part === 'sleeve_length') targetField = 'sleeve_length';
          else if (part === 'pant_length') targetField = 'pant_length';
          else if (part === 'inseam') targetField = 'inseam';

          setActiveField(targetField);
          const val = data.measurements[targetField];
          setTypedValue(val && val !== 0 ? val.toString() : '');
          setMeasSection(upperFields.includes(targetField) ? 'upper' : 'lower');
          showToast(`Focused: ${targetField.replace('_', ' ')}`, 'info');
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: activeField ? '240px' : '0' }}>
            
            {/* ── INTERACTIVE BODY VISUAL HEADER ── */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '80px 1fr', 
                gap: '16px', 
                padding: '14px', 
                borderRadius: '20px', 
                background: 'var(--glass-bg)', 
                border: '1px solid var(--glass-border)'
              }}
            >
              {/* Micro Mannequin silhouette */}
              <div style={{ width: '80px', height: '124px', background: 'var(--glass-bg-elevated)', padding: '6px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <BodySilhouette activePart={activePart} onPartTap={handleSilhouetteTap} />
              </div>

              {/* Active measurement details panel */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {activeField ? (
                  <>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selected Dimension</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 6px 0' }}>
                      {MEASUREMENT_GUIDES[activeField]?.label || activeField}
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {activeInstruction}
                    </p>
                    <button
                      onClick={() => setIsGuideOpen(true)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px solid rgba(52, 211, 153, 0.2)',
                        color: 'var(--success)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Info size={12} /> View Full Guide
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Tactile Measuring Mode</div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4, margin: '4px 0 0 0' }}>
                      Tap any outline region on the body mannequin or select a field from the list below to begin guided inputs.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── EXPANDABLE MEASUREMENT GROUPS ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Upper Body Group */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div 
                  onClick={() => setMeasSection(measSection === 'upper' ? 'notes' : 'upper')}
                  className="collapse-header"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderBottomLeftRadius: measSection === 'upper' ? '0' : '14px',
                    borderBottomRightRadius: measSection === 'upper' ? '0' : '14px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800, color: measSection === 'upper' ? 'var(--success)' : 'var(--text-secondary)' }}>
                    UPPER BODY DIMENSIONS
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--glass-bg-elevated)', padding: '2px 8px', borderRadius: '10px' }}>
                    {filledUpper} / {upperFields.length}
                  </span>
                </div>
                {measSection === 'upper' && (
                  <div style={{ padding: '10px 12px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderTop: 'none', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
                    {([
                      ['Shoulder', 'shoulder'], ['Chest', 'chest'], ['Waist', 'waist'],
                      ['Hip', 'hip'], ['Sleeve Length', 'sleeve_length'], ['Arm Length', 'arm_length'],
                      ['Collar', 'collar'], ['Neck', 'neck'], ['Cuff', 'cuff'], ['Across Back', 'across_back'],
                    ] as [string, keyof Measurements][]).map(([lbl, fld]) => (
                      <MeasRow 
                        key={fld} 
                        label={lbl} 
                        field={fld} 
                        data={data.measurements}
                        activeField={activeField}
                        onFocus={(f) => {
                          setActiveField(f);
                          const val = data.measurements[f];
                          setTypedValue(val && val !== 0 ? val.toString() : '');
                        }}
                        onInfo={(f) => {
                          setActiveField(f);
                          const val = data.measurements[f];
                          setTypedValue(val && val !== 0 ? val.toString() : '');
                          setIsGuideOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Lower Body Group */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div 
                  onClick={() => setMeasSection(measSection === 'lower' ? 'notes' : 'lower')}
                  className="collapse-header"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderBottomLeftRadius: measSection === 'lower' ? '0' : '14px',
                    borderBottomRightRadius: measSection === 'lower' ? '0' : '14px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800, color: measSection === 'lower' ? 'var(--success)' : 'var(--text-secondary)' }}>
                    LOWER BODY DIMENSIONS
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--glass-bg-elevated)', padding: '2px 8px', borderRadius: '10px' }}>
                    {filledLower} / {lowerFields.length}
                  </span>
                </div>
                {measSection === 'lower' && (
                  <div style={{ padding: '10px 12px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderTop: 'none', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px' }}>
                    {([
                      ['Inseam', 'inseam'], ['Outseam', 'outseam'], ['Thigh', 'thigh'],
                      ['Knee', 'knee'], ['Bottom Width', 'bottom_width'], ['Pant Length', 'pant_length'],
                    ] as [string, keyof Measurements][]).map(([lbl, fld]) => (
                      <MeasRow 
                        key={fld} 
                        label={lbl} 
                        field={fld} 
                        data={data.measurements}
                        activeField={activeField}
                        onFocus={(f) => {
                          setActiveField(f);
                          const val = data.measurements[f];
                          setTypedValue(val && val !== 0 ? val.toString() : '');
                        }}
                        onInfo={(f) => {
                          setActiveField(f);
                          const val = data.measurements[f];
                          setTypedValue(val && val !== 0 ? val.toString() : '');
                          setIsGuideOpen(true);
                        }}
                      />
                    ))}
                    {([
                      ['Height', 'height', 'cm'], ['Weight', 'weight', 'kg'],
                    ] as [string, keyof Measurements, string][]).map(([lbl, fld, u]) => (
                      <MeasRow 
                        key={fld} 
                        label={lbl} 
                        field={fld} 
                        unit={u}
                        data={data.measurements}
                        activeField={activeField}
                        onFocus={(f) => {
                          setActiveField(f);
                          const val = data.measurements[f];
                          setTypedValue(val && val !== 0 ? val.toString() : '');
                        }}
                        onInfo={(f) => {
                          setActiveField(f);
                          const val = data.measurements[f];
                          setTypedValue(val && val !== 0 ? val.toString() : '');
                          setIsGuideOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Style & Fitting Notes */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div 
                  onClick={() => setMeasSection(measSection === 'notes' ? 'upper' : 'notes')}
                  className="collapse-header"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderBottomLeftRadius: measSection === 'notes' ? '0' : '14px',
                    borderBottomRightRadius: measSection === 'notes' ? '0' : '14px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800, color: measSection === 'notes' ? 'var(--success)' : 'var(--text-secondary)' }}>
                    FITTING & STYLE NOTES
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Notes</span>
                </div>
                {measSection === 'notes' && (
                  <div style={{ padding: '14px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderTop: 'none', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Fitting Notes</label>
                      <textarea className="glass-input" placeholder="e.g. Left shoulder 0.5in lower, extra room at back…" rows={3} value={(data.measurements.fitting_notes as string) || ''} onChange={e => setData(d => ({ ...d, measurements: { ...d.measurements, fitting_notes: e.target.value } }))} style={{ resize: 'none' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Style Notes</label>
                      <textarea className="glass-input" placeholder="e.g. 2-button notch lapel, gold buttons, slim fit…" rows={3} value={(data.measurements.style_notes as string) || ''} onChange={e => setData(d => ({ ...d, measurements: { ...d.measurements, style_notes: e.target.value } }))} style={{ resize: 'none' }} />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ── FLOATING ONE-HANDED GLASS KEYPAD ── */}
            {activeField && (
              <div
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  maxWidth: '480px',
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                  borderTop: '1.5px solid var(--glass-border-strong)',
                  borderTopLeftRadius: '24px',
                  borderTopRightRadius: '24px',
                  padding: '14px 18px calc(14px + var(--safe-bottom))',
                  zIndex: 900,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'var(--glass-shadow)',
                  animation: 'slideUp 0.22s cubic-bezier(0.1, 0.76, 0.55, 0.94)'
                }}
              >
                {/* Banner header of active field */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Metric</span>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1px' }}>
                      {MEASUREMENT_GUIDES[activeField]?.label || activeField}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setIsGuideOpen(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px solid rgba(52, 211, 153, 0.2)',
                        color: 'var(--success)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Show Guide
                    </button>
                    <button
                      onClick={() => setActiveField(null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>

                {/* Grid inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      onClick={() => handleKeypadPress(num)}
                      style={{
                        height: '42px',
                        borderRadius: '10px',
                        background: 'var(--glass-bg-elevated)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        fontSize: '18px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                      className="glass-card-hover"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => handleKeypadPress('.')}
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--glass-bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      fontSize: '18px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    className="glass-card-hover"
                  >
                    .
                  </button>
                  <button
                    onClick={() => handleKeypadPress('0')}
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--glass-bg-elevated)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      fontSize: '18px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    className="glass-card-hover"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleKeypadPress('backspace')}
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--danger-bg)',
                      border: '1px solid rgba(248, 113, 113, 0.15)',
                      color: 'var(--danger)',
                      fontSize: '16px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    className="glass-card-hover"
                  >
                    ⌫
                  </button>
                </div>

                {/* Dedicated fractions row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <button
                    onClick={() => handleKeypadPress('1/4')}
                    style={{
                      height: '38px',
                      borderRadius: '8px',
                      background: 'var(--glass-bg-strong)',
                      border: '1px solid var(--glass-border-strong)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    className="glass-card-hover"
                  >
                    ¼ (.25)
                  </button>
                  <button
                    onClick={() => handleKeypadPress('1/2')}
                    style={{
                      height: '38px',
                      borderRadius: '8px',
                      background: 'var(--glass-bg-strong)',
                      border: '1px solid var(--glass-border-strong)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    className="glass-card-hover"
                  >
                    ½ (.5)
                  </button>
                  <button
                    onClick={() => handleKeypadPress('clear')}
                    style={{
                      height: '38px',
                      borderRadius: '8px',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    className="glass-card-hover"
                  >
                    Clear
                  </button>
                </div>

                {/* Nav buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                  <button
                    onClick={() => handleKeypadNav('prev')}
                    style={{
                      flex: 1,
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    className="glass-card-hover"
                  >
                    ← Previous Field
                  </button>
                  <button
                    onClick={() => handleKeypadNav('next')}
                    style={{
                      flex: 1,
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(52, 211, 153, 0.12)',
                      border: '1px solid rgba(52, 211, 153, 0.2)',
                      color: 'var(--success)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    className="glass-card-hover"
                  >
                    Next Field →
                  </button>
                </div>
              </div>
            )}

            {/* ── CONTEXTUAL MEASUREMENT GUIDE DRAWER ── */}
            {isGuideOpen && activeField && (
              <div 
                className="modal-overlay" 
                style={{ zIndex: 1200, position: 'fixed' }} 
                onClick={() => setIsGuideOpen(false)}
              >
                <div
                  className="modal-sheet"
                  style={{
                    background: 'var(--bg-secondary)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    borderTop: '1px solid var(--glass-border-strong)',
                    boxShadow: 'var(--glass-shadow)',
                    maxHeight: '75%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px 20px calc(20px + var(--safe-bottom)) 20px'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Modal Handle bar */}
                  <div className="modal-handle" style={{ background: 'var(--text-dim)', width: '36px', height: '4px', marginBottom: '14px' }} />

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Measurement Guide</div>
                      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                        {MEASUREMENT_GUIDES[activeField]?.label || activeField}
                      </h2>
                    </div>
                    <button
                      onClick={() => setIsGuideOpen(false)}
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
                        cursor: 'pointer'
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Content scroll block */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingBottom: '16px' }}>
                    
                    {/* Centered mannequin silhouette */}
                    <div style={{ width: '130px', height: '220px', padding: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BodySilhouette activePart={MEASUREMENT_GUIDES[activeField]?.pathHighlight || ''} />
                    </div>

                    {/* Rich Instruction details */}
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--glass-bg-elevated)', border: '1px solid var(--glass-border-strong)', width: '100%', textAlign: 'center' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {MEASUREMENT_GUIDES[activeField]?.instruction || 'Place measuring tape comfortably around the specified body area.'}
                      </p>
                    </div>

                    {/* Action Close button */}
                    <button
                      className="glass-btn glass-btn-primary glass-btn-full"
                      onClick={() => setIsGuideOpen(false)}
                      style={{ marginTop: 'auto', padding: '13px', fontSize: '13px' }}
                    >
                      Got It, Start Entry
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      }

      // ── Step 6: Summary ──────────────────────────────────────────────────
      case 6:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Customer */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <span className="section-label" style={{ marginBottom: '10px', display: 'block' }}>Customer</span>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{data.customerName}</div>
              {data.customerPhone && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>{data.customerPhone}</div>}
              {data.customerAddress && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{data.customerAddress}</div>}
            </div>

            {/* Clothing */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <span className="section-label" style={{ marginBottom: '10px', display: 'block' }}>Clothing</span>
              {data.clothingItems.map(i => (
                <div key={i.type} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{i.type}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>× {i.qty}</span>
                </div>
              ))}
            </div>

            {/* Photos */}
            {data.referenceImages.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {data.referenceImages.map((u, i) => (
                  <img key={i} src={u} alt="ref" style={{ width: '72px', height: '72px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                ))}
              </div>
            )}

            {/* Billing */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <span className="section-label" style={{ marginBottom: '10px', display: 'block' }}>Billing</span>
              <div className="info-row"><span className="info-row-label">Total</span><span className="info-row-value">₨ {Number(data.totalAmount).toLocaleString()}</span></div>
              <div className="info-row"><span className="info-row-label">Advance</span><span className="info-row-value" style={{ color: 'var(--success)' }}>₨ {Number(data.advanceAmount).toLocaleString()}</span></div>
              <div className="info-row"><span className="info-row-label">Balance</span><span className="info-row-value" style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>₨ {remaining.toLocaleString()}</span></div>
              <div className="info-row" style={{ border: 'none' }}><span className="info-row-label">Delivery</span><span className="info-row-value">{data.deliveryDate}</span></div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (showSuccessCard) {
    return (
      <div className="wizard-overlay" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '380px', width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          {/* Glowing Green Check Circle */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--success-bg)',
            border: '2px solid var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)',
            boxShadow: '0 0 20px rgba(29, 138, 99, 0.15)',
            marginBottom: '4px'
          }}>
            <Check size={32} strokeWidth={3} />
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Order Scheduled
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              The tailoring job and measurements have been saved successfully to the system database.
            </p>
          </div>

          <div className="divider" style={{ width: '100%', margin: '4px 0' }} />

          {/* Quick Summary Box */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(26, 45, 66, 0.03)', border: '1px solid rgba(26, 45, 66, 0.06)', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Client</span>
              <strong style={{ color: 'var(--text-primary)' }}>{data.customerName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Garment</span>
              <strong style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.clothingItems.map(i => `${i.qty}x ${i.type}`).join(', ')}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Delivery Date</span>
              <strong style={{ color: 'var(--text-primary)' }}>{data.deliveryDate}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Balance Due</span>
              <strong style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>
                ₨ {remaining.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Action Button */}
          <button className="glass-btn glass-btn-primary glass-btn-full" onClick={handleFinalClose} style={{ marginTop: '10px' }}>
            Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-overlay">
      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>NEW STITCHING ORDER</div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{STEP_LABELS[step - 1]}</div>
          </div>
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {STEP_LABELS.map((_, i) => (
            <div key={i} className={`step-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`} />
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {step} / {STEP_LABELS.length}
          </span>
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px' }}>
        {renderStep()}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '10px', paddingBottom: `calc(14px + var(--safe-bottom))` }}>
        {step > 1 && (
          <button className="glass-btn glass-btn-secondary" onClick={() => setStep(s => s - 1)} style={{ flex: '0 0 auto', padding: '13px 18px' }}>
            <ChevronLeft size={18} />
          </button>
        )}

        {step < 6 ? (
          <button
            className="glass-btn glass-btn-primary"
            style={{ flex: 1 }}
            onClick={() => { if (canNext()) setStep(s => s + 1); else showToast('Please complete this step', 'warning'); }}
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button className="glass-btn glass-btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
            {isSaving ? 'Saving…' : 'Save Order'}
          </button>
        )}
      </div>
    </div>
  );
};
