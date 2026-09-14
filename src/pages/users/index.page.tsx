import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { Search, Trash2 } from 'lucide-react';

import { cookieManager, formatRoleLabel, formatShortName, logError } from '@/_base/utils';
import { useAsyncCallback } from '@/_base/hooks';
import { getProfile, listUsers, updateUserCredentials } from '@/_base/services/user';
import { removeUser } from '@/_base/services/user/removeUser';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, TextField } from '@/components/ui/form-controls';
import { CancelButton, SubmitButton, GhostButton } from '@/components/ui/form-buttons';

interface IProps {
  user: IHubUser;
}

type DataType = {
  id: string;
  role: string;
  name: string;
  email: string;
  username: string;
  class_name: string;
  network_school_name: string;
};

const roleLabel = (role: IHubUser['role']) => formatRoleLabel(role) || role || '-';

const formatTableData = (user: IHubUser): DataType => ({
  id: user.id,
  role: roleLabel(user.role),
  name: formatShortName(user.name, true),
  email: user.email || `-`,
  username: user.username,
  network_school_name: user.school_group?.display_name || `-`,
  class_name: user.hub_class?.display_name || `-`,
});

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const Users: React.FC<IProps> = () => {
  const [targetUser, setTargetUser] = useState<IHubUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [users, setUsers] = useState<IHubUser[]>([]);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const toast = useToast();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { results } = await listUsers();
        setUsers(results);
      } catch {
        toast({ status: `error`, description: `Ocorreu um erro` });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setTableData(users.map(formatTableData));
  }, [users]);

  const handleOpenUserModal = (id: string) => {
    const hubUser = users.find((e) => e.id === id);
    if (hubUser) {
      setTargetUser(hubUser);
      setNewPassword('');
    }
  };

  const handleUpdateUser = useAsyncCallback(
    async () => {
      if (!targetUser) return;
      setIsLoading(true);

      const updatedUser = await updateUserCredentials({
        hub_user_id: targetUser.id,
        email: targetUser.email,
        username: targetUser.username,
        password: newPassword || undefined,
      });

      setUsers((s) => s.map((e) => (e.id === updatedUser.id ? { ...targetUser, ...updatedUser } : e)));
      setTargetUser(null);

      toast({ description: 'Usuário atualizado!', status: 'success' });
    },
    [targetUser, newPassword],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveUser = useAsyncCallback(
    async () => {
      if (!targetUser) return;
      setIsLoading(true);

      await removeUser(targetUser.id);

      setUsers((s) => s.filter((e) => e.id !== targetUser.id));
      setTargetUser(null);
      setRemoveOpen(false);
      toast({ description: 'Usuário removido!', status: 'success' });
    },
    [targetUser],
    false,
    () => setIsLoading(false),
  );

  const filteredData = tableData.filter((row) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      row.name?.toLowerCase().includes(q) ||
      row.email?.toLowerCase().includes(q) ||
      row.username?.toLowerCase().includes(q) ||
      row.role?.toLowerCase().includes(q) ||
      row.class_name?.toLowerCase().includes(q) ||
      row.network_school_name?.toLowerCase().includes(q)
    );
  });

  const columns: Column<DataType>[] = [
    {
      key: 'user',
      header: 'Usuário',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-gradient-to-br from-brand-usuarios/20 to-brand-formacoes/20 grid place-items-center text-[11px] font-semibold text-zinc-700">
            {getInitials(r.name)}
          </div>
          <div>
            <div className="font-medium text-zinc-900">{r.name}</div>
            <div className="text-xs text-zinc-500">{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'papel', header: 'Papel', render: (r) => <span className="text-zinc-600">{r.role}</span> },
    { key: 'turma', header: 'Turma', render: (r) => <span className="text-zinc-600">{r.class_name}</span> },
    { key: 'rede', header: 'Rede', render: (r) => <span className="text-zinc-600">{r.network_school_name}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenUserModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="font-sans">
      <PageHeader title="Usuários" description="Visualize, edite acessos e gerencie os usuários da plataforma." />

      <div className="mb-4 max-w-xs relative">
        <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail, turma ou rede"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-usuarios/30 focus:border-brand-usuarios transition"
        />
      </div>

      <DataTable columns={columns} data={filteredData} empty={isLoading ? 'Carregando...' : 'Nenhum usuário cadastrado.'} />

      {/* View / Edit modal */}
      <Modal
        open={!!targetUser}
        onClose={() => setTargetUser(null)}
        title={targetUser?.name ?? 'Usuário'}
        width="max-w-lg"
        footer={
          <>
            <CancelButton onClick={() => setTargetUser(null)} />
            <SubmitButton onClick={handleUpdateUser} disabled={!targetUser?.username?.trim()} brandClass="bg-brand-usuarios">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetUser && (
          <div className="space-y-5">
            <Field label="Papel">
              <TextField value={roleLabel(targetUser.role)} readOnly />
            </Field>
            <Field label="E-mail" required>
              <TextField value={targetUser.email ?? ''} onChange={(v) => setTargetUser((e) => (e ? { ...e, email: v } : e))} />
            </Field>
            <Field label="Nome de usuário" required>
              <TextField value={targetUser.username} onChange={(v) => setTargetUser((e) => (e ? { ...e, username: v } : e))} />
            </Field>
            <Field label="Nova senha" hint="Deixe em branco para manter a senha atual.">
              <TextField value={newPassword} onChange={setNewPassword} placeholder="••••••••" />
            </Field>

            <div className="pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemoveOpen(true)}>
                <Trash2 className="size-4" /> Excluir {roleLabel(targetUser.role)}
              </GhostButton>
            </div>

            {targetUser.schools.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Escolas vinculadas</h3>
                <div className="flex flex-wrap gap-1.5">
                  {targetUser.schools.map((school) => (
                    <span key={school.id} className="px-2.5 py-1 text-xs font-medium bg-muted text-foreground rounded-md">
                      {school.display_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={handleRemoveUser}
        title={`Remover ${targetUser?.name ?? 'usuário'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />
    </div>
  );
};

export default Users;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'users';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Usuários' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
