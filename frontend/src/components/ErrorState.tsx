'use client';

import React from 'react';
import { AlertTriangle } from './icons';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="parchment-card parchment-card-crimson"
      style={{
        display: 'grid',
        justifyItems: 'center',
        textAlign: 'center',
        padding: '3rem 2rem',
        backgroundColor: 'var(--crimson-glow)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--crimson-glow)',
          color: 'var(--crimson-accent)',
          marginBottom: '1rem',
        }}
      >
        <AlertTriangle size={28} />
      </div>
      <h3 className="gothic-header" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--crimson-accent)' }}>
        Scriptorium Connection Disrupted
      </h3>
      <p style={{ color: 'var(--text-muted)', maxWidth: '460px', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: onRetry ? '1.5rem' : 0 }}>
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary">
          Reconnect Scriptorium
        </button>
      )}
    </div>
  );
}

export class DataErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onRetry?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={this.state.error?.message ?? 'An unexpected error occurred while loading scholastic records.'}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
