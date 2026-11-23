import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { cookieManager, logError } from '@/_base/utils';
import { getProfile } from '@/_base/services/user';
import { listAuditLogs } from '@/_base/services/audit';
import { IAuditLog } from '@/_base/interfaces/audit';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { Field, SelectField } from '@/components/ui/form-controls';
import { CancelButton } from '@/components/ui/form-buttons';

interface IProps {
  user: IHubUser;
}

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  'school_group.restrict_access': 'Restringiu/habilitou acesso da rede',
  'school.restrict_access': 'Restringiu/habilitou acesso da escola',
  'class.restrict_access': 'Restringiu/habilitou acesso da turma',
  'user.change_school_group': 'Alterou rede, escola ou turma do usuário',
  'user.update_credentials': 'Alterou credenciais do usuário',
  'user.delete': 'Excluiu usuário',
  'school_group.create': 'Criou rede',
  'school_group.update': 'Editou rede',
  'school_group.delete': 'Excluiu rede',
  'school.create': 'Criou escola',
  'school.update': 'Editou escola',
  'school.delete': 'Excluiu escola',
  'school.reset_password': 'Resetou senhas da escola',
  'class.create': 'Criou turma',
  'class.update': 'Editou turma',
  'class.delete': 'Excluiu turma',
  'class.reset_password': 'Resetou senhas da turma',
};

const TARGET_LABELS: Record<string, string> = {
  user: 'Usuário',
  school: 'Escola',
  school_group: 'Rede',
  class: 'Turma',
  permission: 'Permissão',
  book: 'Livro',
  video: 'Vídeo',
  course: 'Formação',
  project: 'Projeto',
  stock: 'Estoque',
};

const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;
const targetLabel = (type: string) => TARGET_LABELS[type] ?? type;

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label }));
const TARGET_OPTIONS = Object.entries(TARGET_LABELS).map(([value, label]) => ({ value, label }));

const SENSITIVE_KEY = /pass(word)?|senha|token|secret/i;

// Defense in depth: the backend must redact sensitive fields, but never render them if one slips through.
const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? '••••••' : redact(v)]));
  }
  return value;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
};

const inputClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-estoque/30 focus:border-brand-estoque transition';

const Audit: React.FC<IProps> = () => {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [targetLog, setTargetLog] = useState<IAuditLog | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const toast = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change goes back to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, action, targetType, from, to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await listAuditLogs({
          page,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          action,
          target_type: targetType,
          from,
          to,
        });
        if (cancelled) return;
        setLogs(res.results ?? []);
        setTotal(res.total ?? res.results?.length ?? 0);
        setPages(res.pages ?? 1);
        setUnavailable(false);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status === 404) setUnavailable(true);
        else toast({ status: 'error', description: 'Não foi possível carregar o histórico' });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, action, targetType, from, to]);

  const columns: Column<IAuditLog>[] = [
    { key: 'quando', header: 'Quando', render: (r) => <span className="text-zinc-600 whitespace-nowrap tabular-nums">{formatDate(r.created_at)}</span> },
    {
      key: 'admin',
      header: 'Admin',
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-zinc-900">{r.admin?.name ?? 'Admin removido'}</span>
          {r.admin?.email && <span className="text-xs text-zinc-500">{r.admin.email}</span>}
        </div>
      ),
    },
    {
      key: 'acao',
      header: 'Ação',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-zinc-900">{actionLabel(r.action)}</span>
          <span className="text-[11px] text-zinc-400">{r.action}</span>
        </div>
      ),
    },
    {
      key: 'alvo',
      header: 'Alvo',
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-zinc-900">{r.target_label || '-'}</span>
          <span className="text-[11px] text-zinc-400">{targetLabel(r.target_type)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Resultado',
      render: (r) =>
        r.status_code >= 400 ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Falhou ({r.status_code})</span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">Sucesso</span>
        ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => setTargetLog(r)}>
            Detalhes
          </ActionButton>
        </div>
      ),
    },
  ];

  const hasFilters = !!(search || action || targetType || from || to);

  return (
    <div className="font-sans">
      <PageHeader title="Auditoria" description="Histórico das ações feitas por administradores no CMS: quem fez, o quê e quando." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por admin ou alvo"
            className={`${inputClass} pl-9`}
          />
        </div>
        <SelectField value={action} onChange={setAction} options={ACTION_OPTIONS} placeholder="Todas as ações" />
        <SelectField value={targetType} onChange={setTargetType} options={TARGET_OPTIONS} placeholder="Todos os alvos" />
        <div className="flex items-center gap-2">
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputClass} aria-label="De" />
          <span className="text-xs text-zinc-400">até</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputClass} aria-label="Até" />
        </div>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setAction('');
            setTargetType('');
            setFrom('');
            setTo('');
          }}
          className="mb-4 text-xs font-medium text-brand-estoque hover:underline"
        >
          Limpar filtros
        </button>
      )}

      <DataTable
        columns={columns}
        data={logs}
        pageSize={PAGE_SIZE}
        empty={
          isLoading
            ? 'Carregando...'
            : unavailable
              ? 'O histórico ainda não está disponível no servidor (rota /audit/list não encontrada).'
              : hasFilters
                ? 'Nenhum registro para esses filtros.'
                : 'Nenhuma ação registrada ainda.'
        }
      />

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Página {page} de {pages} · {total} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages || isLoading}
              className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      <Modal
        open={!!targetLog}
        onClose={() => setTargetLog(null)}
        title={targetLog ? actionLabel(targetLog.action) : 'Detalhes'}
        width="max-w-2xl"
        footer={<CancelButton onClick={() => setTargetLog(null)} />}
      >
        {targetLog && (
          <div className="space-y-4 text-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Admin">
                <div className="text-foreground">{targetLog.admin ? `${targetLog.admin.name} (${targetLog.admin.email})` : 'Admin removido'}</div>
              </Field>
              <Field label="Quando">
                <div className="text-foreground">{formatDate(targetLog.created_at)}</div>
              </Field>
              <Field label="Alvo">
                <div className="text-foreground">
                  {targetLog.target_label || '-'} <span className="text-muted-foreground">({targetLabel(targetLog.target_type)})</span>
                </div>
              </Field>
              <Field label="Requisição">
                <div className="text-foreground break-all">
                  {targetLog.method} {targetLog.route} · {targetLog.status_code}
                </div>
              </Field>
            </div>
            {targetLog.changes && (
              <div className="grid sm:grid-cols-2 gap-3">
                <JsonBlock title="Antes" value={targetLog.changes.before} />
                <JsonBlock title="Depois" value={targetLog.changes.after} />
              </div>
            )}
            <JsonBlock title="Dados enviados" value={targetLog.payload} />
            {targetLog.ip && <p className="text-xs text-muted-foreground">IP: {targetLog.ip}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">{title}</h3>
      <pre className="rounded-lg bg-muted p-3 text-xs text-foreground overflow-x-auto max-h-64">
        {value ? JSON.stringify(redact(value), null, 2) : '—'}
      </pre>
    </div>
  );
}

export default Audit;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'audit';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Auditoria' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
