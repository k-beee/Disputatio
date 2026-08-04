'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EXPLORER_URL } from '@/lib/contract';
import { Loader2 } from './icons';

export interface ToastItem {
  id: string;
  kind: 'info' | 'success' | 'error' | 'loading';
  title: string;
  body?: string;
  txHash?: string;
}

type Listener = (toasts: ToastItem[]) => void;
let toastList: ToastItem[] = [];
const activeListeners = new Set<Listener>();

function triggerUpdate() {
  activeListeners.forEach((listener) => listener([...toastList]));
}

export function pushToast(item: Omit<ToastItem, 'id'>): string {
  const id = Math.random().toString(36).slice(2, 9);
  const newToast: ToastItem = { ...item, id };
  toastList.push(newToast);
  triggerUpdate();

  if (item.kind !== 'loading') {
    setTimeout(() => {
      dismissToast(id);
    }, 6000);
  }

  return id;
}

export function dismissToast(id: string) {
  toastList = toastList.filter((t) => t.id !== id);
  triggerUpdate();
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleUpdate = (updatedList: ToastItem[]) => {
      setToasts(updatedList);
    };
    activeListeners.add(handleUpdate);
    setToasts([...toastList]);
    return () => {
      activeListeners.delete(handleUpdate);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        right: '1.5rem',
        bottom: '1.5rem',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: '100%',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          let cardStyle: React.CSSProperties = {
            borderLeft: '4px solid var(--border)',
            padding: '1rem',
            position: 'relative',
            backgroundColor: 'var(--surface)',
            width: '100%',
          };
          
          if (toast.kind === 'success') {
            cardStyle.borderLeft = '4px solid var(--teal-accent)';
          } else if (toast.kind === 'error') {
            cardStyle.borderLeft = '4px solid var(--crimson-accent)';
          } else if (toast.kind === 'loading') {
            cardStyle.borderLeft = '4px solid var(--gold-accent)';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="parchment-card"
              style={cardStyle}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {toast.kind === 'loading' && (
                  <span style={{ display: 'inline-flex', color: 'var(--gold-accent)', animation: 'spin 1.2s linear infinite', flexShrink: 0, marginTop: 2 }}>
                    <Loader2 size={16} className="spin-icon" />
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5 className="gothic-header" style={{ fontSize: '1rem', margin: 0 }}>
                    {toast.title}
                  </h5>
                  {toast.body && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      {toast.body}
                    </p>
                  )}
                  {toast.txHash && (
                    <a
                      href={`${EXPLORER_URL}/tx/${toast.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--crimson-accent)',
                        textDecoration: 'underline',
                        display: 'block',
                        marginTop: '4px',
                      }}
                    >
                      Inspect Receipt
                    </a>
                  )}
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-faint)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '2px',
                    marginLeft: '4px',
                  }}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
