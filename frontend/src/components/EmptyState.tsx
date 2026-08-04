'use client';

import React from 'react';
import { BookOpen } from './icons';

interface EmptyStateProps {
  title: string;
  body: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div
      className="parchment-card"
      style={{
        display: 'grid',
        justifyItems: 'center',
        textAlign: 'center',
        padding: '3rem 2rem',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(0,0,0,0.01)',
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
          backgroundColor: 'var(--gold-glow)',
          color: 'var(--gold-accent)',
          marginBottom: '1rem',
        }}
      >
        <BookOpen size={28} />
      </div>
      <h3 className="gothic-header" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '1rem', lineHeight: 1.5, marginBottom: action ? '1.5rem' : 0 }}>
        {body}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
