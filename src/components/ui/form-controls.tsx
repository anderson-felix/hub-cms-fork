import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Copy, Search, Upload, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export function Field({
  label,
  required,
  children,
  hint,
  error,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : (
        hint && <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  readOnly,
  error,
}: {
  value: string | undefined;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  error?: string;
}) {
  return (
    <input
      value={value ?? ''}
      readOnly={readOnly}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-redes/30 focus:border-brand-redes transition',
        readOnly ? 'bg-muted text-muted-foreground cursor-default border-input' : 'text-foreground border-input',
        error && 'border-destructive focus:ring-destructive/30 focus:border-destructive',
      )}
    />
  );
}

export type MultiSelectOption = { value: string; label: string };

export function MultiSelect({
  options,
  value: valueProp,
  onChange,
  placeholder = 'Selecione',
  brandClass = 'text-brand-redes',
  brandBgClass = 'bg-brand-redes/10',
  ringClass = 'focus:ring-brand-redes/30 focus:border-brand-redes',
}: {
  options: MultiSelectOption[];
  value: string[] | undefined;
  onChange: (v: string[]) => void;
  placeholder?: string;
  brandClass?: string;
  brandBgClass?: string;
  ringClass?: string;
}) {
  // `data` from useInputHandler starts as `{}` (not the caller's initial value), so `value` is
  // routinely undefined on first render — default it here so every call site doesn't need `?? []`.
  const value = valueProp ?? [];
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [dark, setDark] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.filter((o) => value.includes(o.value));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    setDark(!!document.querySelector('.hub-cms-shell.dark'));
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full min-h-10 px-3 py-1.5 text-sm rounded-lg border border-input bg-background flex items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 transition',
          ringClass,
        )}
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((o) => (
              <span
                key={o.value}
                className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md', brandBgClass, brandClass)}
              >
                {o.label}
                <X
                  className="size-3 hover:text-rose-500 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(o.value);
                  }}
                />
              </span>
            ))
          )}
        </div>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open &&
        position &&
        createPortal(
          <div className={cn('hub-cms-shell font-sans', dark && 'dark')}>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <div
              style={{ top: position.top, left: position.left, width: position.width }}
              className="fixed z-[101] bg-background rounded-lg border border-input shadow-lg py-1 max-h-60 overflow-y-auto"
            >
              {options.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma opção disponível.</div>
              ) : (
                options.map((o) => {
                  const checked = value.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(o.value)}
                      className="w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-muted"
                    >
                      <span className="text-foreground">{o.label}</span>
                      {checked && <Check className={cn('size-4', brandClass)} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  error,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-redes/30 focus:border-brand-redes transition',
        error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : 'border-input',
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SearchableSelectField({
  options,
  value,
  onChange,
  placeholder = 'Selecione',
  searchPlaceholder = 'Buscar...',
  brandClass = 'text-brand-redes',
  ringClass = 'focus:ring-brand-redes/30 focus:border-brand-redes',
  error,
}: {
  options: MultiSelectOption[];
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  brandClass?: string;
  ringClass?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [dark, setDark] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));

  const updatePosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    setQuery('');
    setDark(!!document.querySelector('.hub-cms-shell.dark'));
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    const focusTimeout = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      clearTimeout(focusTimeout);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full h-10 px-3 text-sm rounded-lg border bg-background flex items-center justify-between gap-2 text-left focus:outline-none focus:ring-2 transition',
          ringClass,
          error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : 'border-input',
        )}
      >
        <span className={cn('truncate', selected ? 'text-foreground' : 'text-muted-foreground')}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('size-4 text-muted-foreground shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open &&
        position &&
        createPortal(
          <div className={cn('hub-cms-shell font-sans', dark && 'dark')}>
            <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
            <div
              style={{ top: position.top, left: position.left, width: position.width }}
              className="fixed z-[101] bg-background rounded-lg border border-input shadow-lg overflow-hidden"
            >
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className={cn(
                      'w-full pl-7 pr-2 py-1.5 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition',
                      ringClass,
                    )}
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted transition"
                  >
                    {placeholder}
                  </button>
                )}
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado encontrado.</div>
                ) : (
                  filtered.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-muted transition"
                    >
                      <span className="text-foreground truncate">{o.label}</span>
                      {o.value === value && <Check className={cn('size-4 shrink-0', brandClass)} />}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export function RadioGroup({
  value,
  onChange,
  options,
  brandClass = 'text-brand-escolas border-brand-escolas',
}: {
  value: string;
  onChange: (v: string) => void;
  options: MultiSelectOption[];
  brandClass?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <span
            className={cn(
              'size-4 rounded-full border flex items-center justify-center shrink-0',
              value === o.value ? brandClass : 'border-input',
            )}
            onClick={() => onChange(o.value)}
          >
            {value === o.value && <span className={cn('size-2 rounded-full', brandClass.split(' ')[0].replace('text-', 'bg-'))} />}
          </span>
          <span onClick={() => onChange(o.value)}>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

export function FileField({
  onChange,
  fileName,
  accept,
  brandClass = 'text-brand-redes',
}: {
  onChange: (file: File | null) => void;
  fileName?: string | null;
  accept?: string;
  brandClass?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-muted transition"
      >
        <Upload className={cn('size-3.5', brandClass)} />
        Escolher arquivo
      </button>
      <span className="text-xs text-muted-foreground truncate max-w-[14rem]">{fileName || 'Nenhum arquivo selecionado'}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export function CopyButton({
  getText,
  onCopied,
  className,
}: {
  getText: () => string;
  onCopied?: () => void;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard access denied — silently no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copiar"
      className={cn(
        'shrink-0 h-10 w-10 grid place-items-center rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition',
        className,
      )}
    >
      {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
    </button>
  );
}

export function TextAreaField({
  value,
  onChange,
  placeholder,
  rows = 3,
  error,
}: {
  value: string | undefined;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
}) {
  return (
    <textarea
      value={value ?? ''}
      rows={rows}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-redes/30 focus:border-brand-redes transition resize-y',
        error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive' : 'border-input',
      )}
    />
  );
}

export function TagsField({
  value: valueProp,
  onChange,
  suggestions = [],
  placeholder = 'Digite e pressione Enter',
  brandClass = 'text-brand-redes',
  brandBgClass = 'bg-brand-redes/10',
  ringClass = 'focus-within:ring-brand-redes/30 focus-within:border-brand-redes',
}: {
  value: string[] | undefined;
  onChange: (v: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  brandClass?: string;
  brandBgClass?: string;
  ringClass?: string;
}) {
  const value = valueProp ?? [];
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  const add = (tag: string) => {
    const t = tag.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setInput('');
  };
  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const filteredSuggestions = suggestions.filter((s) => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase()));

  return (
    <div className="relative">
      <div
        className={cn(
          'w-full min-h-10 px-3 py-1.5 rounded-lg border border-input bg-background flex flex-wrap gap-1.5 items-center focus-within:outline-none focus-within:ring-2 transition',
          ringClass,
        )}
      >
        {value.map((tag) => (
          <span key={tag} className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md', brandBgClass, brandClass)}>
            {tag}
            <X className="size-3 hover:text-rose-500 cursor-pointer" onClick={() => remove(tag)} />
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(input);
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[6rem] bg-transparent text-sm text-foreground outline-none py-1"
        />
      </div>
      {open && filteredSuggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-background rounded-lg border border-input shadow-lg py-1 max-h-48 overflow-y-auto">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(s)}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-muted text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ColorSwatchPicker({ value, onChange, colors }: { value?: string; onChange: (c: string) => void; colors: string[] }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            'size-5 rounded-full ring-2 ring-offset-1 ring-offset-background transition',
            value === c ? 'ring-foreground' : 'ring-transparent',
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  activeClass = 'bg-brand-redes',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0', checked ? activeClass : 'bg-zinc-300')}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </button>
  );
}
