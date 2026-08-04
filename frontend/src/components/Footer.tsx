'use client';

import { CONTRACT_ADDRESS, EXPLORER_URL } from '@/lib/contract';
import { shortAddr } from '@/lib/format';
import { Copy } from './icons';

export function Footer() {
  const handleCopy = () => {
    if (CONTRACT_ADDRESS) {
      navigator.clipboard.writeText(CONTRACT_ADDRESS);
      alert('Contract address copied!');
    }
  };

  return (
    <footer style={{ marginTop: '5rem', padding: '3rem 0 4rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: var(--text-muted), fontSize: '0.9rem' }}>
      <div className="shell" style={{ display: 'grid', gap: '2rem' }}>
        <div style={{ textAlign: 'center', margin: '0 auto', maxWidth: '680px', display: 'grid', gap: '0.75rem' }}>
          <h4 className="gothic-header" style={{ color: 'var(--crimson-accent)', fontSize: '1.4rem', letterSpacing: '0.05em' }}>
            DISPUTATIO
          </h4>
          <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
            Disputatio is a decentralized scholastic debate coliseum running on GenLayer. It implements a formalized logical dispute mechanism where ideas clash for supremacy under the objective adjudication of an AI validator jury. Designed with incumbent burden-of-proof prompting and numeric consensus tolerance to establish permanent, on-chain dialectical progressions.
          </p>
        </div>

        <div className="scholastic-divider" />

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="uppercase-tab" style={{ fontSize: '0.8rem' }}>Contract Address:</span>
            {CONTRACT_ADDRESS ? (
              <>
                <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{shortAddr(CONTRACT_ADDRESS)}</span>
                <button onClick={handleCopy} aria-label="Copy address" style={{ color: 'var(--crimson-accent)', cursor: 'pointer', background: 'none', border: 'none' }}>
                  <Copy size={13} />
                </button>
                <a 
                  href={`${EXPLORER_URL}/address/${CONTRACT_ADDRESS}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--crimson-accent)', textDecoration: 'underline', fontSize: '0.8rem', marginLeft: '0.5rem' }}
                >
                  View on Explorer
                </a>
              </>
            ) : (
              <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>Not Deployed Yet</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
