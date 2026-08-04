'use client';

import { QuaestioRecord } from '@/lib/contract';
import { shortAddr } from '@/lib/format';
import { Swords } from './icons';

interface ProgressionHistoryProps {
  quaestio: QuaestioRecord;
}

export function ProgressionHistory({ quaestio }: ProgressionHistoryProps) {
  const history = quaestio.progression || [];

  return (
    <div className="parchment-card" style={{ display: 'grid', gap: '1.25rem' }}>
      <div className="card-corner-top-right" />
      <div className="card-corner-bottom-left" />

      <h4 className="gothic-header" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
        Dialectical Progression Timeline
      </h4>

      {history.length === 0 ? (
        <p style={{ color: 'var(--text-faint)', fontSize: '0.95rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
          This Quaestio is in its initial stage. No historical overthrows have occurred yet.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '1.25rem',
            position: 'relative',
            paddingLeft: '1.5rem',
            borderLeft: '1px double var(--border-strong)',
            marginLeft: '0.5rem',
            marginTop: '0.5rem',
          }}
        >
          {history.map((entry, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                display: 'grid',
                gap: '0.4rem',
              }}
            >
              {/* Stepper Dot */}
              <div
                style={{
                  position: 'absolute',
                  left: 'calc(-1.5rem - 6px)',
                  top: '6px',
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-primary)',
                  border: '2px solid var(--border-strong)',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span className="uppercase-tab" style={{ fontSize: '0.7rem', color: 'var(--crimson-accent)', fontWeight: 'bold' }}>
                  Stage {entry.progression_index}
                </span>
                <span className="badge" style={{ fontSize: '0.62rem' }}>
                  <Swords size={9} /> USURPED BY {shortAddr(entry.toppled_by)} (Margin {entry.margin})
                </span>
              </div>

              <blockquote
                style={{
                  fontStyle: 'italic',
                  fontSize: '1.05rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.45,
                }}
              >
                "{entry.claim}"
              </blockquote>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                Defended by: <strong style={{ color: 'var(--text-muted)' }}>{shortAddr(entry.proponent)}</strong> • {entry.defenses} times
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
