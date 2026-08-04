'use client';

import { motion } from 'framer-motion';
import { QuaestioRecord } from '@/lib/contract';
import { shortAddr } from '@/lib/format';
import { Crown, Swords } from './icons';

interface ThesisCardProps {
  quaestio: QuaestioRecord;
  onDispute: () => void;
  onRaiseNew: () => void;
  justChanged?: boolean;
}

export function ThesisCard({
  quaestio,
  onDispute,
  onRaiseNew,
  justChanged = false,
}: ThesisCardProps) {
  return (
    <motion.div
      animate={justChanged ? { scale: [1, 1.02, 1], borderColor: 'var(--teal-accent)' } : {}}
      transition={{ duration: 0.5 }}
      className="parchment-card"
      style={{
        padding: '2.5rem 2rem',
        display: 'grid',
        gap: '1.25rem',
        position: 'relative',
        borderWidth: '2px',
      }}
    >
      <div className="card-corner-top-right" />
      <div className="card-corner-bottom-left" />

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span className="uppercase-tab" style={{ fontSize: '0.72rem', color: 'var(--crimson-accent)', fontWeight: 'bold' }}>
          Active Quaestio debate • {quaestio.id}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-gold">Generation {quaestio.progression_index}</span>
          <span className="badge badge-teal">{quaestio.defenses} Defenses</span>
        </div>
      </div>

      <div className="scholastic-divider" style={{ margin: '0.25rem 0' }} />

      {/* Quaestio Topic */}
      <h2 className="gothic-header" style={{ fontSize: '1.75rem', lineHeight: 1.25, color: 'var(--white-chalk)' }}>
        {quaestio.topic}
      </h2>

      {/* Current Active Claim / Thesis */}
      <div
        style={{
          borderLeft: '3px solid var(--border-strong)',
          paddingLeft: '1.25rem',
          margin: '0.5rem 0',
          backgroundColor: 'rgba(0,0,0,0.01)',
          padding: '1.25rem',
          borderRadius: '3px',
        }}
      >
        <span
          className="badge"
          style={{
            color: 'var(--gold-accent)',
            borderColor: 'rgba(217, 119, 6, 0.2)',
            backgroundColor: 'var(--gold-glow)',
            marginBottom: '0.75rem',
          }}
        >
          <Crown size={12} /> Reigning Thesis
        </span>
        <p
          style={{
            fontStyle: 'italic',
            fontSize: '1.25rem',
            lineHeight: 1.5,
            color: 'var(--text-primary)',
          }}
        >
          "{quaestio.claim}"
        </p>
      </div>

      {/* Proponent attribution */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--text-faint)' }}>
        <span>
          Established by founder: <strong style={{ color: 'var(--text-muted)' }}>{shortAddr(quaestio.founder)}</strong>
        </span>
        <span>
          Reigning Proponent: <strong style={{ color: 'var(--crimson-accent)' }}>{shortAddr(quaestio.proponent)}</strong>
        </span>
      </div>

      <div className="scholastic-divider" style={{ margin: '0.5rem 0' }} />

      {/* Interactive Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={onDispute} className="btn btn-primary" style={{ flex: 1, minWidth: '160px' }}>
          <Swords size={15} />
          Challenge Thesis
        </button>
        <button onClick={onRaiseNew} className="btn btn-secondary">
          Propose Alternative Topic
        </button>
      </div>
    </motion.div>
  );
}
