'use client';

export function ThesisSkeleton() {
  return (
    <div
      className="parchment-card"
      style={{
        padding: '2rem',
        display: 'grid',
        gap: '1rem',
        animation: 'pulse 1.8s infinite ease-in-out',
        minHeight: '260px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ height: '12px', width: '120px', backgroundColor: 'var(--border)', borderRadius: '2px' }} />
        <div style={{ height: '12px', width: '40px', backgroundColor: 'var(--border)', borderRadius: '2px' }} />
      </div>
      <div className="scholastic-divider" />
      <div style={{ height: '26px', width: '90%', backgroundColor: 'var(--border)', borderRadius: '2px', marginTop: '4px' }} />
      <div style={{ height: '26px', width: '45%', backgroundColor: 'var(--border)', borderRadius: '2px' }} />
      <div style={{ height: '14px', width: '185px', backgroundColor: 'var(--border)', borderRadius: '2px', marginTop: '6px' }} />
      <div style={{ display: 'flex', gap: '1rem', marginTop: '12px' }}>
        <div style={{ height: '36px', width: '140px', backgroundColor: 'var(--border)', borderRadius: '2px' }} />
      </div>
    </div>
  );
}
