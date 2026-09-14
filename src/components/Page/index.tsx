import { useRouter } from 'next/router';
import { PropsWithChildren, useState } from 'react';
import { LogOut, X } from 'lucide-react';

import { IPageProps } from '@/_base/hooks/Page/interfaces';
import { cn } from '@/lib/utils';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { useShellTheme } from './useShellTheme';

const NAKED_PAGES = ['login', 'signup', 'help', 'recover_password'];

function SidebarContent({
  selectedPage,
  user,
  isOpen,
  stopTour,
  onNavigate,
}: {
  selectedPage?: string;
  user: IPageProps['user'];
  isOpen: boolean;
  stopTour: () => void;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  return (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="size-9 bg-white rounded-lg ring-1 ring-zinc-200 flex items-center justify-center p-1.5">
          <img src="/logo/pi-logo-dark.svg" alt="PiCode" width={24} height={26} />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold tracking-tight leading-none text-zinc-900">PiCode</span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">Education</span>
        </div>
      </div>

      <Navbar page={selectedPage ?? ''} user={user} isOpen={isOpen} stopTour={stopTour} onNavigate={onNavigate} />

      <div className="p-4 border-t border-zinc-200">
        <button
          type="button"
          onClick={() => router.push('/logout')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900 rounded-md transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          Sair
        </button>
      </div>
    </>
  );
}

export const PageWrapper: React.FC<PropsWithChildren<IPageProps>> = ({
  selectedPage,
  user,
  children,
  headerLabel,
  showBackButton = true,
  isOpen = false,
  stopTour,
}) => {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useShellTheme();

  if (!selectedPage || NAKED_PAGES.includes(selectedPage)) {
    return <>{children}</>;
  }

  return (
    <div className={cn('hub-cms-shell font-sans flex min-h-screen bg-zinc-50 text-zinc-900', theme === 'dark' && 'dark')}>
      <aside className="hidden lg:flex w-64 border-r border-zinc-200 bg-zinc-100/60 flex-col sticky top-0 h-screen">
        <SidebarContent selectedPage={selectedPage} user={user} isOpen={isOpen} stopTour={stopTour} />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-zinc-900/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[80vw] bg-zinc-50 border-r border-zinc-200 flex flex-col">
            <button
              type="button"
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-900"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar"
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              selectedPage={selectedPage}
              user={user}
              isOpen={isOpen}
              stopTour={stopTour}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          headerLabel={headerLabel}
          selectedPage={selectedPage}
          theme={theme}
          onToggleTheme={toggle}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {showBackButton && (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1 font-semibold text-zinc-600 hover:text-zinc-900 pb-2 w-fit"
            >
              <span aria-hidden>←</span>
              Voltar
            </button>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};
