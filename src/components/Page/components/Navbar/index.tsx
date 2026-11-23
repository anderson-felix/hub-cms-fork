import { useRouter } from 'next/router';
import {
  Home,
  Network,
  School,
  GraduationCap,
  Users2,
  BookOpen,
  Video,
  GanttChart,
  FolderKanban,
  ClipboardList,
  Boxes,
  KeyRound,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { INavbarProps } from './interfaces';

type NavItem = { name: string; page: string; icon: LucideIcon; brandClass?: string };

const BRAND_TEXT_CLASS = {
  redes: 'text-brand-redes',
  escolas: 'text-brand-escolas',
  turmas: 'text-brand-turmas',
  usuarios: 'text-brand-usuarios',
  formacoes: 'text-brand-formacoes',
  livros: 'text-brand-livros',
  videos: 'text-brand-videos',
  permissoes: 'text-brand-permissoes',
  projetos: 'text-brand-projetos',
  estoque: 'text-brand-estoque',
} as const;

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Gerenciamento',
    items: [
      { name: 'Home', page: 'home', icon: Home },
      { name: 'Redes', page: 'networks', icon: Network, brandClass: BRAND_TEXT_CLASS.redes },
      { name: 'Escolas', page: 'schools', icon: School, brandClass: BRAND_TEXT_CLASS.escolas },
      { name: 'Turmas', page: 'classes', icon: GraduationCap, brandClass: BRAND_TEXT_CLASS.turmas },
      { name: 'Usuários', page: 'users', icon: Users2, brandClass: BRAND_TEXT_CLASS.usuarios },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { name: 'Livros', page: 'books', icon: BookOpen, brandClass: BRAND_TEXT_CLASS.livros },
      { name: 'Vídeos', page: 'videos', icon: Video, brandClass: BRAND_TEXT_CLASS.videos },
      { name: 'Formações', page: 'courses', icon: GanttChart, brandClass: BRAND_TEXT_CLASS.formacoes },
      { name: 'Projetos', page: 'projects', icon: FolderKanban, brandClass: BRAND_TEXT_CLASS.projetos },
      { name: 'Avaliações', page: 'forms', icon: ClipboardList, brandClass: BRAND_TEXT_CLASS.formacoes },
      { name: 'Estoque', page: 'stock', icon: Boxes, brandClass: BRAND_TEXT_CLASS.estoque },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { name: 'Permissões', page: 'permissions', icon: KeyRound, brandClass: BRAND_TEXT_CLASS.permissoes },
      { name: 'Auditoria', page: 'audit', icon: ScrollText, brandClass: BRAND_TEXT_CLASS.estoque },
    ],
  },
];

export const Navbar: React.FC<INavbarProps> = ({ page, onNavigate }) => {
  const router = useRouter();

  return (
    <nav className="flex-1 px-4 space-y-4 overflow-y-auto pb-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <div className="px-3 mb-1 text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{group.label}</div>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = page === item.page;
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => {
                    router.push(`/${item.page}`);
                    onNavigate?.();
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left',
                    active ? 'bg-zinc-200/70 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900',
                  )}
                >
                  <Icon className={cn('size-4 shrink-0', active && item.brandClass ? item.brandClass : 'text-zinc-500')} />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
};
