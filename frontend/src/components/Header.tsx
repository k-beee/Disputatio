'use client';

import { useEffect, useState } from 'react';
import { WalletHookState } from '@/hooks/useWallet';
import { ColiseumStats, withdrawFees, makeWalletClient } from '@/lib/contract';
import { shortAddr } from '@/lib/format';
import { Coins, Loader2, Menu } from './icons';

interface HeaderProps {
  wallet: WalletHookState;
  stats: ColiseumStats | null;
  onRefreshStats?: () => void;
}

export function Header({ wallet, stats, onRefreshStats }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
      setTheme(activeTheme || 'light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleWithdraw = async () => {
    if (!wallet.userAddress) return;
    setIsWithdrawing(true);
    try {
      const client = makeWalletClient(wallet.userAddress);
      const hash = await withdrawFees(client);
      alert(`Treasury withdrawal initiated. Tx Hash: ${hash}`);
      onRefreshStats?.();
    } catch (e) {
      alert(`Withdrawal failed: ${String((e as { message?: string })?.message ?? e)}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formattedFees = stats ? (Number(stats.accumulated_fees) / 1e18).toFixed(2) : '0.00';

  return (
    <header style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', position: 'relative', zIndex: 30 }}>
      <div className="shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h1 className="gothic-header" style={{ fontSize: '2rem', letterSpacing: '0.05em', margin: 0, color: 'var(--crimson-accent)' }}>
            DISPUTATIO
          </h1>
          <span className="badge badge-gold" style={{ fontSize: '0.62rem', marginLeft: '0.5rem' }}>StudioNet</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Treasury status */}
          {stats && Number(stats.accumulated_fees) > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--gold-accent)', padding: '0.35rem 0.75rem', borderRadius: '3px', backgroundColor: 'var(--gold-glow)' }}>
              <Coins size={14} color="var(--gold-accent)" />
              <span className="uppercase-tab" style={{ fontSize: '0.7rem', color: 'var(--gold-accent)' }}>
                Treasury: {formattedFees} GEN
              </span>
              <button 
                onClick={handleWithdraw} 
                className="btn" 
                disabled={isWithdrawing || !wallet.userAddress}
                style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', marginLeft: '0.5rem', backgroundColor: 'var(--crimson-accent)', color: '#fff', border: 'none' }}
              >
                {isWithdrawing ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : 'Withdraw'}
              </button>
            </div>
          ) : null}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}
            aria-label="Switch theme"
          >
            {theme === 'light' ? '☾' : '☼'}
          </button>

          {/* Wallet Connect */}
          {wallet.userAddress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-teal">
                {shortAddr(wallet.userAddress)}
              </span>
              <span className="uppercase-tab" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                {wallet.nativeBalance || '0.00'} GEN
              </span>
              <button onClick={wallet.triggerDisconnect} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={wallet.triggerConnect} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              Connect Scriptorium
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
