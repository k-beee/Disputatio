'use client';

export function InteractiveBackground() {
  return (
    <div 
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden ambient-scriptorium" 
      aria-hidden="true" 
    />
  );
}
