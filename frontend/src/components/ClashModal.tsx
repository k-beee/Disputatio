'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { QuaestioRecord, JuryVerdictDraft } from '@/lib/contract';
import { TxWorkflowState } from '@/hooks/useTransaction';
import { AlertTriangle, Crown, Loader2, Shield, Swords } from './icons';

export interface ClashModalProps {
  open: boolean;
  onClose: () => void;
  quaestio: QuaestioRecord | null;
  tx: TxWorkflowState;
  outcome: 'OVERTHROW' | 'DEFEND' | null;
  onSubmit: (antithesis: string) => void;
  onRetry: () => void;
}

const STEPS = [
  { key: 'PROPOSING', label: 'Proposing' },
  { key: 'COMMITTING', label: 'Committing' },
  { key: 'REVEALING', label: 'Revealing' },
  { key: 'ACCEPTED', label: 'Ruled' },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'PENDING':
    case 'PROPOSING':
      return 0;
    case 'COMMITTING':
      return 1;
    case 'REVEALING':
      return 2;
    case 'ACCEPTED':
    case 'FINALIZED':
      return 3;
    default:
      return 0;
  }
}

function ArgumentSlab({
  side,
  claim,
  isWinner,
}: {
  side: 'thesis' | 'antithesis';
  claim: string;
  isWinner: boolean | null;
}) {
  const isThesis = side === 'thesis';
  const isDimmed = isWinner === false;
  return (
    <motion.div
      animate={{
        opacity: isDimmed ? 0.45 : 1,
        scale: isWinner ? 1.01 : 1,
        borderColor: isWinner ? 'var(--teal-accent)' : 'var(--border)',
      }}
      className="parchment-card"
      style={{
        flex: 1,
        minWidth: 0,
        padding: '1rem',
        display: 'grid',
        gap: 6,
        alignContent: 'start',
        backgroundColor: 'rgba(0,0,0,0.02)',
      }}
    >
      <span
        className="badge"
        style={{
          color: isThesis ? 'var(--gold-accent)' : 'var(--crimson-accent)',
          borderColor: isThesis ? 'rgba(217,119,6,0.2)' : 'rgba(153,27,27,0.2)',
          width: 'fit-content',
        }}
      >
        {isThesis ? <Crown size={11} /> : <Swords size={11} />}
        {isThesis ? 'Incumbent Thesis' : 'Opposing Antithesis'}
      </span>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{claim}</p>
    </motion.div>
  );
}

export function ClashModal({
  open,
  onClose,
  quaestio,
  tx,
  outcome,
  onSubmit,
  onRetry,
}: ClashModalProps) {
  const [claim, setClaim] = useState('');

  useEffect(() => {
    if (open && tx.currentPhase === 'idle') {
      setClaim('');
    }
  }, [open, tx.currentPhase]);

  if (!quaestio) return null;

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (claim.trim().length >= 10) {
      onSubmit(claim.trim());
    }
  };

  const isValid = claim.trim().length >= 10;
  const isProcessing =
    tx.currentPhase === 'signing' || tx.currentPhase === 'sent' || tx.currentPhase === 'deliberation';
  const isSettled = tx.currentPhase === 'finalized' && outcome !== null;

  const activeStepIdx = getStepIndex(tx.consensusProgress);
  const isTimeout = tx.consensusProgress === 'LEADER_TIMEOUT' || tx.consensusProgress === 'VALIDATORS_TIMEOUT';
  const thesisWon = isSettled ? outcome === 'DEFEND' : null;
  const antithesisWon = isSettled ? outcome === 'OVERTHROW' : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Dispute: ${quaestio.topic}`}
      eyebrow="Scholastic Adjudication"
      closeable={!isProcessing}
    >
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {/* Duel View (Active when transacting or finished) */}
        {(isProcessing || isSettled) ? (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch', position: 'relative', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
              <ArgumentSlab side="thesis" claim={quaestio.claim} isWinner={thesisWon} />
              <ArgumentSlab side="antithesis" claim={claim || '...'} isWinner={antithesisWon} />
            </div>
          </div>
        ) : null}

        {/* Input Form */}
        {tx.currentPhase === 'idle' ? (
          <form onSubmit={onFormSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
            <div
              className="parchment-card"
              style={{ padding: '0.85rem 1rem', display: 'grid', gap: 4, backgroundColor: 'rgba(0,0,0,0.02)' }}
            >
              <span className="uppercase-tab" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--gold-accent)' }}>
                <Crown size={12} /> Active Thesis Proponent
              </span>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                "{quaestio.claim}"
              </p>
            </div>

            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <label htmlFor="refutation-textarea" className="uppercase-tab" style={{ fontSize: '0.75rem' }}>
                Your Opposing Antithesis
              </label>
              <textarea
                id="refutation-textarea"
                rows={4}
                className="input-field"
                placeholder="Formulate your scholastic objection. Validators will judge the arguments head-to-head based on logical consistency and reasoning..."
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                maxLength={500}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                <span>Min 10 chars (0.05 GEN fee required)</span>
                <span>{claim.length}/500 chars</span>
              </div>
            </div>

            <div className="scholastic-divider" style={{ margin: '0.5rem 0' }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!isValid} style={{ minWidth: 140 }}>
                <Swords size={15} />
                Clash claims
              </button>
            </div>
          </form>
        ) : null}

        {/* Polling Consensus Steps */}
        {isProcessing && tx.currentPhase !== 'signing' ? (
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {STEPS.map((step, idx) => (
                <div key={step.key} className="step-node">
                  <div className={`step-line ${idx <= activeStepIdx ? 'step-line-active' : ''}`} />
                  <span
                    className="uppercase-tab"
                    style={{
                      fontSize: '0.6rem',
                      color: idx <= activeStepIdx ? 'var(--gold-accent)' : 'var(--text-faint)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 1.2 }}
                style={{ display: 'inline-flex', color: 'var(--gold-accent)' }}
              >
                <Loader2 size={15} />
              </motion.span>
              {isTimeout
                ? 'Jury rotating leader, searching consensus...'
                : 'Jury evaluating arguments under decentralized consensus...'}
            </div>

            {/* Leader Draft Peek */}
            <AnimatePresence>
              {tx.peekedDraft ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="parchment-card"
                  style={{
                    padding: '0.75rem 1rem',
                    borderColor: 'var(--border-strong)',
                    display: 'grid',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="uppercase-tab" style={{ color: 'var(--gold-accent)', fontSize: '0.7rem' }}>
                      Jury Draft Verdict
                    </span>
                    <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {tx.peekedDraft.verdict}
                      {typeof tx.peekedDraft.margin === 'number' ? ` (margin ${tx.peekedDraft.margin})` : ''}
                    </span>
                  </div>
                  {tx.peekedDraft.note ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{tx.peekedDraft.note}"
                    </p>
                  ) : null}
                  <span style={{ color: 'var(--text-faint)', fontSize: '0.72rem' }}>
                    Draft outputs proposed by consensus leader while validators verify votes.
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        {/* Signing in wallet */}
        {tx.currentPhase === 'signing' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite', color: 'var(--gold-accent)' }}>
              <Loader2 size={16} />
            </span>
            <span>Approve transaction fee in browser wallet...</span>
          </div>
        ) : null}

        {/* Adjudicated / Settled State */}
        {isSettled ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'grid', justifyItems: 'center', gap: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}
          >
            {outcome === 'OVERTHROW' ? (
              <>
                <span className="scholastic-stamp stamp-overthrown">Overthrown</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: 400 }}>
                  The Antithesis objection successfully overthrew the incumbent Thesis. The scholastic timeline advances.
                </p>
              </>
            ) : (
              <>
                <span className="scholastic-stamp stamp-defended">Defended</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: 400 }}>
                  The Proponent successfully defended their Thesis. The incumbent claim stands.
                </p>
              </>
            )}

            {tx.peekedDraft?.note ? (
              <div
                className="parchment-card"
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.92rem',
                  maxWidth: 440,
                  lineHeight: 1.45,
                  textAlign: 'left',
                  marginTop: 6,
                  color: 'var(--text-muted)',
                  borderLeft: '3px solid var(--border-strong)',
                }}
              >
                "{tx.peekedDraft.note}"
              </div>
            ) : null}

            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '0.75rem', minWidth: 150 }}>
              Return to Coliseum
            </button>
          </motion.div>
        ) : null}

        {/* Error Screen */}
        {tx.currentPhase === 'reverted' ? (
          <div
            className="parchment-card parchment-card-crimson"
            role="alert"
            style={{
              padding: '1.25rem',
              display: 'grid',
              gap: 12,
              justifyItems: 'center',
              textAlign: 'center',
            }}
          >
            <span style={{ color: 'var(--crimson-accent)' }}>
              <AlertTriangle size={24} />
            </span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.4, maxWidth: 400 }}>
              {tx.errorMessage}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: 4 }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={onRetry}>
                <Shield size={14} />
                Retry Challenge
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
