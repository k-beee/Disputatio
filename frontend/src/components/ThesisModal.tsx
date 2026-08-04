'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Coins } from './icons';

interface ThesisModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (topic: string, claim: string) => void;
  submitting: boolean;
}

export function ThesisModal({
  open,
  onClose,
  onSubmit,
  submitting,
}: ThesisModalProps) {
  const [topic, setTopic] = useState('');
  const [thesis, setThesis] = useState('');

  useEffect(() => {
    if (open && !submitting) {
      setTopic('');
      setThesis('');
    }
  }, [open, submitting]);

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (topic.trim().length >= 4 && thesis.trim().length >= 10) {
      onSubmit(topic.trim(), thesis.trim());
    }
  };

  const isValid = topic.trim().length >= 4 && thesis.trim().length >= 10;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Propose New Quaestio"
      eyebrow="Scholastic Registration"
      closeable={!submitting}
    >
      <form onSubmit={onFormSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
        {/* Fee Alert */}
        <div
          className="parchment-card"
          style={{
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: 'var(--gold-glow)',
            borderColor: 'var(--gold-accent)',
          }}
        >
          <Coins size={16} color="var(--gold-accent)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Establishing a new topic requires a disputation fee of <strong>0.05 GEN</strong> (refundable if transaction fails).
          </span>
        </div>

        {/* Topic Input */}
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <label htmlFor="topic-input" className="uppercase-tab" style={{ fontSize: '0.75rem' }}>
            Quaestio Topic
          </label>
          <input
            id="topic-input"
            type="text"
            className="input-field"
            placeholder="e.g. The Immortality of the Soul"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={90}
            disabled={submitting}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
            <span>Min 4 chars</span>
            <span>{topic.length}/90 chars</span>
          </div>
        </div>

        {/* Thesis Claim Input */}
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <label htmlFor="thesis-input" className="uppercase-tab" style={{ fontSize: '0.75rem' }}>
            Dominant Opening Thesis
          </label>
          <textarea
            id="thesis-input"
            rows={4}
            className="input-field"
            placeholder="State your dominant claim with logical clarity..."
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            maxLength={500}
            disabled={submitting}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
            <span>Min 10 chars</span>
            <span>{thesis.length}/500 chars</span>
          </div>
        </div>

        <div className="scholastic-divider" style={{ margin: '0.5rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isValid || submitting}
            style={{ minWidth: '150px' }}
          >
            {submitting ? 'Transacting...' : 'Raise Quaestio'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
