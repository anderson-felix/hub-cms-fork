import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export type StatBrandKey =
  | 'usuarios'
  | 'redes'
  | 'escolas'
  | 'turmas'
  | 'formacoes'
  | 'livros'
  | 'videos'
  | 'permissoes';

const STYLES: Record<StatBrandKey, { bg: string; text: string; ring: string; chipHover: string }> = {
  usuarios: { bg: 'bg-brand-usuarios/10', text: 'text-brand-usuarios', ring: 'ring-brand-usuarios/20', chipHover: 'hover:bg-brand-usuarios/20' },
  redes: { bg: 'bg-brand-redes/10', text: 'text-brand-redes', ring: 'ring-brand-redes/20', chipHover: 'hover:bg-brand-redes/20' },
  escolas: { bg: 'bg-brand-escolas/10', text: 'text-brand-escolas', ring: 'ring-brand-escolas/20', chipHover: 'hover:bg-brand-escolas/20' },
  turmas: { bg: 'bg-brand-turmas/10', text: 'text-brand-turmas', ring: 'ring-brand-turmas/20', chipHover: 'hover:bg-brand-turmas/20' },
  formacoes: { bg: 'bg-brand-formacoes/10', text: 'text-brand-formacoes', ring: 'ring-brand-formacoes/20', chipHover: 'hover:bg-brand-formacoes/20' },
  livros: { bg: 'bg-brand-livros/10', text: 'text-brand-livros', ring: 'ring-brand-livros/20', chipHover: 'hover:bg-brand-livros/20' },
  videos: { bg: 'bg-brand-videos/10', text: 'text-brand-videos', ring: 'ring-brand-videos/20', chipHover: 'hover:bg-brand-videos/20' },
  permissoes: { bg: 'bg-brand-permissoes/10', text: 'text-brand-permissoes', ring: 'ring-brand-permissoes/20', chipHover: 'hover:bg-brand-permissoes/20' },
};

export function StatCard({
  brand,
  label,
  value,
  icon: Icon,
  onNavigate,
  cta = 'Ver Todos',
  loading = false,
}: {
  brand: StatBrandKey;
  label: string;
  value: number;
  icon: LucideIcon;
  onNavigate: () => void;
  cta?: string;
  loading?: boolean;
}) {
  const s = STYLES[brand];
  return (
    <div className={cn('p-8 rounded-xl ring-1 ring-black/5 space-y-4 transition-shadow hover:shadow-sm', s.bg)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-medium', s.text)}>{label}</span>
        <div className={cn('size-8 ring-1 rounded-md flex items-center justify-center', s.bg, s.ring)}>
          <Icon className={cn('size-4', s.text)} />
        </div>
      </div>
      {loading ? (
        <div className="h-9 w-20 rounded bg-zinc-900/10 animate-pulse" />
      ) : (
        <div className="text-3xl font-semibold text-zinc-900 tracking-tight tabular-nums">
          {value.toLocaleString('pt-BR')}
        </div>
      )}
      <button
        type="button"
        onClick={onNavigate}
        className={cn(
          'w-full py-4 pl-5 pr-4 text-sm font-medium rounded-2xl flex items-center justify-between transition-colors ring-1',
          s.text,
          s.bg,
          s.chipHover,
          s.ring,
        )}
      >
        {cta}
        <ArrowUpRight className="size-4" />
      </button>
    </div>
  );
}
