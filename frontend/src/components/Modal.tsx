'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  closeable?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  closeable = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (closeable) onClose();
            }}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="parchment-card"
            style={{
              position: 'relative',
              zIndex: 10,
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-medieval)',
              borderWidth: '2px',
              borderStyle: 'double',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                {eyebrow && (
                  <span className="uppercase-tab" style={{ fontSize: '0.65rem', display: 'block', marginBottom: '2px' }}>
                    {eyebrow}
                  </span>
                )}
                <h3 className="gothic-header" style={{ fontSize: '1.5rem', color: 'var(--white-chalk)' }}>{title}</h3>
              </div>

              {closeable && (
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Content */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
