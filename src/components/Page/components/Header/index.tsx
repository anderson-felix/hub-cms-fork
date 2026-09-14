import { Bell, Menu, Moon, Sun } from 'lucide-react';

import { IHubAdmin } from '@/_base/interfaces/admin';
import { cn } from '@/lib/utils';
import { PAGE_LABELS } from '../../pageLabels';

interface IProps {
  user?: IHubAdmin;
  headerLabel?: string;
  selectedPage?: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
}

function getInitials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const Header: React.FC<IProps> = ({ user, headerLabel, selectedPage, theme, onToggleTheme, onOpenMobileMenu }) => {
  const breadcrumb = selectedPage ? `Home / ${PAGE_LABELS[selectedPage] ?? selectedPage}` : 'Home';

  return (
    <header className="h-16 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden p-2 -ml-2 text-zinc-600 hover:text-zinc-900"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>
        <span className="text-xs font-medium text-zinc-400 truncate">{breadcrumb}</span>
        {!!headerLabel && (
          <span
            className="hidden sm:inline text-xs font-medium text-zinc-500 truncate border-l border-zinc-200 pl-3"
            title={`Projeto: ${headerLabel}`}
          >
            {headerLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <span className="p-2 rounded-full text-zinc-600" title="Notificações">
          <Bell className="size-4" />
        </span>
        <div
          className={cn(
            'size-8 rounded-full bg-gradient-to-br from-brand-formacoes to-brand-redes text-white text-xs font-semibold',
            'grid place-items-center',
          )}
          title={user?.name}
        >
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
};
