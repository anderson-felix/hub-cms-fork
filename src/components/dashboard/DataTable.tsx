import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  empty = 'Nenhum registro encontrado.',
  pageSize = 15,
}: {
  columns: Column<T>[];
  data: T[];
  empty?: string;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-zinc-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-100">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn('px-6 py-5 font-medium text-zinc-500 whitespace-nowrap', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-950/5">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-zinc-500">
                  {empty}
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/60 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className={cn('px-6 py-4', c.className)}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data.length > pageSize && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-100 dark:border-white/10">
          <span className="text-xs text-zinc-500">
            Página {currentPage} de {totalPages} · {data.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_TONES = {
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  danger: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  neutral: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
} as const;

export function StatusBadge({ tone, children }: { tone: keyof typeof STATUS_TONES; children: ReactNode }) {
  return (
    <span className={cn('px-2 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full', STATUS_TONES[tone])}>
      {children}
    </span>
  );
}

const ACTION_TONES = {
  neutral: 'text-zinc-500 hover:text-zinc-900',
  danger: 'text-zinc-500 hover:text-rose-600',
  primary: 'text-zinc-500 hover:text-brand-redes',
} as const;

export function ActionButton({
  children,
  onClick,
  tone = 'neutral',
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: keyof typeof ACTION_TONES;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('text-xs font-medium px-2 py-1 rounded transition-colors', ACTION_TONES[tone])}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-colors"
    >
      {children}
    </button>
  );
}
