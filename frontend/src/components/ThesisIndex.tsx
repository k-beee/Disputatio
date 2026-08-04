'use client';

import { QuaestioRecord } from '@/lib/contract';

interface ThesisIndexProps {
  quaestiones: QuaestioRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRaiseQuaestio: () => void;
}

export function ThesisIndex({
  quaestiones,
  selectedId,
  onSelect,
  onRaiseQuaestio,
}: ThesisIndexProps) {
  return (
    <div className="parchment-card" style={{ display: 'grid', gap: '1rem', height: 'fit-content' }}>
      <div className="card-corner-top-right" />
      <div className="card-corner-bottom-left" />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h4 className="gothic-header" style={{ fontSize: '1.25rem' }}>Quaestiones</h4>
        <span className="badge">{quaestiones.length} Topics</span>
      </div>

      <div style={{ display: 'grid', gap: '0.35rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
        {quaestiones.map((q) => (
          <button
            key={q.id}
            onClick={() => onSelect(q.id)}
            className={`directory-item ${selectedId === q.id ? 'directory-item-selected' : ''}`}
            style={{ borderRadius: '2px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--crimson-accent)', fontWeight: 'bold' }}>
                {q.id}
              </span>
              <span className="badge" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
                Gen {q.progression_index}
              </span>
            </div>
            <p
              style={{
                fontSize: '0.92rem',
                marginTop: '4px',
                color: selectedId === q.id ? 'var(--text-primary)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {q.topic}
            </p>
          </button>
        ))}
      </div>

      <div className="scholastic-divider" style={{ margin: '0.5rem 0' }} />

      <button onClick={onRaiseQuaestio} className="btn btn-primary" style={{ width: '100%' }}>
        Raise New Quaestio
      </button>
    </div>
  );
}
