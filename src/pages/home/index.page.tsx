import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { Users2, Network, School, GraduationCap, GanttChart, BookOpen, Video, KeyRound } from 'lucide-react';

import { logError, cookieManager, formatRoleLabel, formatShortName } from '@/_base/utils';
import { IHubUser } from '@/_base/interfaces/user';
import { useCustomRouter } from '@/_base/hooks';
import { getProfile, getReportData, IReportDataResponse, listUsers } from '@/_base/services/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard, type StatBrandKey } from '@/components/dashboard/StatCard';
import { DataTable, StatusBadge, type Column } from '@/components/dashboard/DataTable';

interface IProps {
  user: IHubUser;
}

type StatDef = {
  key: keyof IReportDataResponse;
  label: string;
  brand: StatBrandKey;
  icon: typeof Users2;
  page: string;
  cta?: string;
};

const STAT_DEFS: StatDef[] = [
  { key: 'users', label: 'Usuários', brand: 'usuarios', icon: Users2, page: 'users' },
  { key: 'school_groups', label: 'Redes', brand: 'redes', icon: Network, page: 'networks' },
  { key: 'schools', label: 'Escolas', brand: 'escolas', icon: School, page: 'schools' },
  { key: 'classes', label: 'Turmas', brand: 'turmas', icon: GraduationCap, page: 'classes' },
  { key: 'courses', label: 'Formações', brand: 'formacoes', icon: GanttChart, page: 'courses', cta: 'Ver Todas' },
  { key: 'books', label: 'Livros', brand: 'livros', icon: BookOpen, page: 'books', cta: 'Ver Todos' },
  { key: 'videos', label: 'Vídeos', brand: 'videos', icon: Video, page: 'videos' },
  { key: 'permissions', label: 'Permissões', brand: 'permissoes', icon: KeyRound, page: 'permissions' },
];

type RecentUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  school: string;
};

const recentUsersColumns: Column<RecentUserRow>[] = [
  {
    key: 'user',
    header: 'Usuário',
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-100 grid place-items-center text-[10px] font-semibold text-zinc-600">
          {r.name
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-zinc-900">{r.name}</div>
          <div className="text-xs text-zinc-500">{r.email}</div>
        </div>
      </div>
    ),
  },
  { key: 'role', header: 'Papel', render: (r) => <StatusBadge tone="info">{r.role}</StatusBadge> },
  { key: 'school', header: 'Escola / Rede', render: (r) => <span className="text-zinc-600">{r.school}</span> },
];

const Home: React.FC<IProps> = () => {
  const [reportData, setReportData] = useState<IReportDataResponse | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const router = useCustomRouter();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [report, usersRes] = await Promise.all([getReportData(), listUsers()]);
        setReportData(report);
        setRecentUsers(
          usersRes.results.slice(0, 5).map((u) => ({
            id: u.id,
            name: formatShortName(u.name, true),
            email: u.email || '-',
            role: formatRoleLabel(u.role),
            school: u.school_group?.display_name || '-',
          })),
        );
      } catch {
        toast({ status: `error`, description: `Ocorreu um erro` });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="font-sans">
      <PageHeader title="Visão Geral" description="Bem-vindo ao centro de comando da rede PiCode Education." />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_DEFS.map((def) => (
          <StatCard
            key={def.key}
            brand={def.brand}
            label={def.label}
            value={reportData?.[def.key]?.total ?? 0}
            icon={def.icon}
            cta={def.cta}
            loading={isLoading}
            onNavigate={() => router.push(`/${def.page}`)}
          />
        ))}
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Usuários Recentes</h2>
        <DataTable columns={recentUsersColumns} data={recentUsers} empty="Nenhum usuário cadastrado ainda." />
      </section>
    </div>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'home';

  try {
    cookieManager.updateToken(req);

    const admin = await getProfile();

    return { props: { selectedPage, pageTitle: 'Dashboard', admin, showBackButton: false } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);

    return { redirect: { destination: '/login', permanent: false } };
  }
};
