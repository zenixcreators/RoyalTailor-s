import React from 'react';

export const CardSkeleton: React.FC<{ height?: string }> = ({ height = '100px' }) => (
  <div 
    className="skeleton" 
    style={{ 
      height, 
      width: '100%', 
      borderRadius: '20px', 
      marginBottom: '16px',
      border: '1px solid rgba(255, 255, 255, 0.03)'
    }} 
  />
);

export const DashboardSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {/* Header skeleton */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <div className="skeleton" style={{ height: '32px', width: '120px' }} />
      <div className="skeleton" style={{ height: '36px', width: '36px', borderRadius: '50%' }} />
    </div>
    
    {/* Metric Grid skeleton */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <CardSkeleton height="90px" />
      <CardSkeleton height="90px" />
      <CardSkeleton height="90px" />
      <CardSkeleton height="90px" />
    </div>

    {/* Big card skeleton */}
    <CardSkeleton height="140px" />

    {/* List header and rows */}
    <div className="skeleton" style={{ height: '20px', width: '100px', margin: '8px 0' }} />
    <CardSkeleton height="68px" />
    <CardSkeleton height="68px" />
    <CardSkeleton height="68px" />
  </div>
);

export const CustomerListSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div className="skeleton" style={{ height: '45px', width: '100%', borderRadius: '12px', marginBottom: '8px' }} />
    <CardSkeleton height="76px" />
    <CardSkeleton height="76px" />
    <CardSkeleton height="76px" />
    <CardSkeleton height="76px" />
    <CardSkeleton height="76px" />
  </div>
);

export const OrderListSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '8px' }}>
      <div className="skeleton" style={{ height: '32px', minWidth: '80px', borderRadius: '16px' }} />
      <div className="skeleton" style={{ height: '32px', minWidth: '80px', borderRadius: '16px' }} />
      <div className="skeleton" style={{ height: '32px', minWidth: '80px', borderRadius: '16px' }} />
    </div>
    <CardSkeleton height="130px" />
    <CardSkeleton height="130px" />
    <CardSkeleton height="130px" />
  </div>
);

export const FinanceSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <CardSkeleton height="150px" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      <CardSkeleton height="85px" />
      <CardSkeleton height="85px" />
    </div>
    <div className="skeleton" style={{ height: '200px', width: '100%', borderRadius: '20px' }} />
  </div>
);
