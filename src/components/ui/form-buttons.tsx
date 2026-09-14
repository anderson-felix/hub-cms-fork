import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 text-sm font-medium text-foreground rounded-lg border border-border bg-card hover:bg-muted transition"
    >
      Cancelar
    </button>
  );
}

export function SubmitButton({
  children,
  onClick,
  disabled,
  brandClass = 'bg-brand-redes',
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  brandClass?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition',
        brandClass,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  tone = 'neutral',
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'neutral' | 'danger';
}) {
  const tones = {
    neutral: 'border-border text-muted-foreground hover:bg-muted',
    danger: 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50',
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border bg-card transition', tones[tone])}
    >
      {children}
    </button>
  );
}
