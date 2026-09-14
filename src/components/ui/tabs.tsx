import { cn } from '@/lib/utils';

export type TabItem = { value: string; label: string };

export function Tabs({
  items,
  value,
  onChange,
  brandClass = 'text-brand-livros',
}: {
  items: TabItem[];
  value: string;
  onChange: (v: string) => void;
  brandClass?: string;
}) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-zinc-100 mb-4">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors',
              active ? cn('bg-white shadow-sm', brandClass) : 'text-zinc-500 hover:text-zinc-900',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
