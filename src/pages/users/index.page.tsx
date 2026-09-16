import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { AlertTriangle, Repeat, School, Search, Trash2 } from 'lucide-react';

import { cookieManager, formatRoleLabel, formatShortName, logError } from '@/_base/utils';
import { useAsyncCallback } from '@/_base/hooks';
import { changeStudentClass, getProfile, listUsers, updateTeacherSchoolLink, updateUserCredentials } from '@/_base/services/user';
import { removeUser } from '@/_base/services/user/removeUser';
import { listSchools } from '@/_base/services/school';
import { IHubUser } from '@/_base/interfaces/user';
import { IHubSchool } from '@/_base/interfaces/school';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, RadioGroup, SelectField, TextField } from '@/components/ui/form-controls';
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
  school_id: string;
  school_name: string;
  network_id: string;
  network_name: string;
};

const roleLabel = (role: IHubUser['role']) => formatRoleLabel(role) || role || '-';

type SchoolRef = { id: string; display_name: string };

const formatTableData = (user: IHubUser, schoolByClassId: Record<string, SchoolRef>): DataType => {
  const school = (user.hub_class_id && schoolByClassId[user.hub_class_id]) || user.hub_class?.hub_school || user.schools?.[0];

  return {
    id: user.id,
    role: roleLabel(user.role),
    name: formatShortName(user.name, true),
    email: user.email || `-`,
    username: user.username,
    class_name: user.hub_class?.display_name || `-`,
    school_id: school?.id || '',
    school_name: school?.display_name || `-`,
    network_id: user.hub_school_group_id || '',
    network_name: user.school_group?.display_name || `-`,
  };
};

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
  const [schools, setSchools] = useState<IHubSchool[]>([]);
  const [schoolByClassId, setSchoolByClassId] = useState<Record<string, SchoolRef>>({});
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [search, setSearch] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  // Student: change class / school
  const [changeClassOpen, setChangeClassOpen] = useState(false);
  const [newSchoolId, setNewSchoolId] = useState('');
  const [newClassId, setNewClassId] = useState('');
  const [dataLossConfirmed, setDataLossConfirmed] = useState(false);

  // Teacher: link / unlink schools within their own network
  const [teacherSchoolsOpen, setTeacherSchoolsOpen] = useState(false);
  const [schoolLinkAction, setSchoolLinkAction] = useState<'add' | 'remove'>('add');
  const [schoolLinkTargetId, setSchoolLinkTargetId] = useState('');

  const toast = useToast();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [{ results }, { results: schoolResults }] = await Promise.all([listUsers(), listSchools()]);
        setUsers(results);
        setSchools(schoolResults);

        const map: Record<string, SchoolRef> = {};
        schoolResults.forEach((school) =>
          school.classes?.forEach((hubClass) => (map[hubClass.id] = { id: school.id, display_name: school.display_name })),
        );
        setSchoolByClassId(map);
      } catch {
        toast({ status: `error`, description: `Ocorreu um erro` });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setTableData(users.map((user) => formatTableData(user, schoolByClassId)));
  }, [users, schoolByClassId]);

  const handleOpenUserModal = (id: string) => {
    const hubUser = users.find((e) => e.id === id);
    if (hubUser) {
      setTargetUser(hubUser);
      setNewPassword('');
    }
  };

  const handleOpenChangeClassModal = () => {
    if (!targetUser) return;
    const currentSchoolId = (targetUser.hub_class_id && schoolByClassId[targetUser.hub_class_id]?.id) || targetUser.schools?.[0]?.id || '';
    setNewSchoolId(currentSchoolId);
    setNewClassId(targetUser.hub_class_id || '');
    setDataLossConfirmed(false);
    setChangeClassOpen(true);
  };

  const handleChangeStudentClass = useAsyncCallback(
    async () => {
      if (!targetUser || !newSchoolId || !newClassId) return;
      setIsLoading(true);

      const updatedUser = await changeStudentClass({
        hub_user_id: targetUser.id,
        hub_school_group_id: targetUser.hub_school_group_id,
        hub_school_id: newSchoolId,
        hub_class_id: newClassId,
      });

      setUsers((s) => s.map((e) => (e.id === updatedUser.id ? { ...targetUser, ...updatedUser } : e)));
      setTargetUser((e) => (e ? { ...e, ...updatedUser } : e));
      setChangeClassOpen(false);

      toast({ description: 'Turma do aluno atualizada!', status: 'success' });
    },
    [targetUser, newSchoolId, newClassId],
    false,
    () => setIsLoading(false),
  );

  const handleOpenTeacherSchoolsModal = () => {
    setSchoolLinkAction('add');
    setSchoolLinkTargetId('');
    setTeacherSchoolsOpen(true);
  };

  const handleUpdateTeacherSchoolLink = useAsyncCallback(
    async () => {
      if (!targetUser || !schoolLinkTargetId) return;
      setIsLoading(true);

      const updatedUser = await updateTeacherSchoolLink({
        hub_user_id: targetUser.id,
        hub_school_group_id: targetUser.hub_school_group_id,
        hub_school_id: schoolLinkTargetId,
        action: schoolLinkAction,
      });

      setUsers((s) => s.map((e) => (e.id === updatedUser.id ? { ...targetUser, ...updatedUser } : e)));
      setTargetUser((e) => (e ? { ...e, ...updatedUser } : e));
      setSchoolLinkTargetId('');

      toast({
        description: schoolLinkAction === 'add' ? 'Escola vinculada ao professor!' : 'Escola desvinculada do professor!',
        status: 'success',
      });
    },
    [targetUser, schoolLinkTargetId, schoolLinkAction],
    false,
    () => setIsLoading(false),
  );

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

  const networkSchools = schools.filter((s) => s.hub_school_group_id === targetUser?.hub_school_group_id);
  const schoolOptionsForClassChange = networkSchools.map((s) => ({ value: s.id, label: s.display_name }));
  const classOptionsForSelectedSchool = (networkSchools.find((s) => s.id === newSchoolId)?.classes || []).map((c) => ({
    value: c.id,
    label: `${c.display_name} (${c.grade})`,
  }));

  const linkedSchoolIds = new Set(targetUser?.schools?.map((s) => s.id));
  const addableSchoolOptions = networkSchools.filter((s) => !linkedSchoolIds.has(s.id)).map((s) => ({ value: s.id, label: s.display_name }));
  const removableSchoolOptions = (targetUser?.schools || []).map((s) => ({ value: s.id, label: s.display_name }));
  const schoolLinkOptions = schoolLinkAction === 'add' ? addableSchoolOptions : removableSchoolOptions;

  const networkOptions = Array.from(new Map(tableData.filter((r) => r.network_id).map((r) => [r.network_id, r.network_name])).entries()).map(
    ([value, label]) => ({ value, label }),
  );

  const schoolOptions = Array.from(
    new Map(
      tableData.filter((r) => r.school_id && (!networkFilter || r.network_id === networkFilter)).map((r) => [r.school_id, r.school_name]),
    ).entries(),
  ).map(([value, label]) => ({ value, label }));

  const filteredData = tableData.filter((row) => {
    if (networkFilter && row.network_id !== networkFilter) return false;
    if (schoolFilter && row.school_id !== schoolFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      row.name?.toLowerCase().includes(q) ||
      row.email?.toLowerCase().includes(q) ||
      row.username?.toLowerCase().includes(q) ||
      row.role?.toLowerCase().includes(q) ||
      row.class_name?.toLowerCase().includes(q) ||
      row.school_name?.toLowerCase().includes(q) ||
      row.network_name?.toLowerCase().includes(q)
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
    { key: 'escola', header: 'Escola', render: (r) => <span className="text-zinc-600">{r.school_name}</span> },
    { key: 'rede', header: 'Rede', render: (r) => <span className="text-zinc-600">{r.network_name}</span> },
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

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-full sm:w-56">
          <SelectField
            value={networkFilter}
            onChange={(v) => {
              setNetworkFilter(v);
              setSchoolFilter('');
            }}
            options={networkOptions}
            placeholder="Todas as redes"
          />
        </div>
        <div className="w-full sm:w-56">
          <SelectField value={schoolFilter} onChange={setSchoolFilter} options={schoolOptions} placeholder="Todas as escolas" />
        </div>
        <div className="flex-1 min-w-[16rem] relative">
          <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, turma, escola ou rede"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-usuarios/30 focus:border-brand-usuarios transition"
          />
        </div>
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

            {targetUser.role === 'student' && (
              <div className="pt-2 border-t border-border">
                <GhostButton onClick={handleOpenChangeClassModal}>
                  <Repeat className="size-4" /> Alterar turma / escola
                </GhostButton>
              </div>
            )}

            {targetUser.role === 'teacher' && (
              <div className="pt-2 border-t border-border">
                <GhostButton onClick={handleOpenTeacherSchoolsModal}>
                  <School className="size-4" /> Gerenciar escolas vinculadas
                </GhostButton>
              </div>
            )}

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

      {/* Student: change class / school modal */}
      <Modal
        open={changeClassOpen}
        onClose={() => setChangeClassOpen(false)}
        title="Alterar turma / escola"
        footer={
          <>
            <CancelButton onClick={() => setChangeClassOpen(false)} />
            <SubmitButton
              onClick={handleChangeStudentClass}
              disabled={!newSchoolId || !newClassId || !dataLossConfirmed}
              brandClass="bg-brand-usuarios"
            >
              Confirmar alteração
            </SubmitButton>
          </>
        }
      >
        {targetUser && (
          <div className="space-y-5">
            <Field label="Rede" hint="A rede do aluno não muda nessa ação.">
              <TextField value={targetUser.school_group?.display_name ?? '-'} readOnly />
            </Field>
            <Field label="Escola" required>
              <SelectField
                value={newSchoolId}
                onChange={(v) => {
                  setNewSchoolId(v);
                  setNewClassId('');
                }}
                options={schoolOptionsForClassChange}
                placeholder="Selecione a escola"
              />
            </Field>
            <Field label="Turma" required hint={!newSchoolId ? 'Selecione uma escola primeiro.' : undefined}>
              <SelectField value={newClassId} onChange={setNewClassId} options={classOptionsForSelectedSchool} placeholder="Selecione a turma" />
            </Field>

            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3.5 flex gap-2.5">
              <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                Ao confirmar, os dados do aluno serão desvinculados do cadastro anterior (turma/escola atual) — todo o progresso feito nessa turma
                será perdido.
              </p>
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={dataLossConfirmed}
                onChange={(e) => setDataLossConfirmed(e.target.checked)}
                className="mt-0.5 size-4 rounded border-input accent-destructive"
              />
              Estou ciente de que o progresso do aluno na turma/escola atual será perdido.
            </label>
          </div>
        )}
      </Modal>

      {/* Teacher: link / unlink schools modal */}
      <Modal
        open={teacherSchoolsOpen}
        onClose={() => setTeacherSchoolsOpen(false)}
        title="Escolas vinculadas ao professor"
        footer={
          <>
            <CancelButton onClick={() => setTeacherSchoolsOpen(false)} />
            <SubmitButton
              onClick={handleUpdateTeacherSchoolLink}
              disabled={!schoolLinkTargetId}
              brandClass={schoolLinkAction === 'remove' ? 'bg-destructive' : 'bg-brand-usuarios'}
            >
              {schoolLinkAction === 'add' ? 'Vincular escola' : 'Desvincular escola'}
            </SubmitButton>
          </>
        }
      >
        {targetUser && (
          <div className="space-y-5">
            <Field label="Rede" hint="Só é possível vincular escolas da mesma rede do professor.">
              <TextField value={targetUser.school_group?.display_name ?? '-'} readOnly />
            </Field>
            <Field label="Ação">
              <RadioGroup
                value={schoolLinkAction}
                onChange={(v) => {
                  setSchoolLinkAction(v as 'add' | 'remove');
                  setSchoolLinkTargetId('');
                }}
                options={[
                  { value: 'add', label: 'Adicionar escola' },
                  { value: 'remove', label: 'Remover escola' },
                ]}
              />
            </Field>
            <Field
              label="Escola"
              required
              hint={schoolLinkOptions.length === 0 ? (schoolLinkAction === 'add' ? 'Nenhuma escola disponível para vincular.' : 'Nenhuma escola vinculada.') : undefined}
            >
              <SelectField
                value={schoolLinkTargetId}
                onChange={setSchoolLinkTargetId}
                options={schoolLinkOptions}
                placeholder="Selecione a escola"
              />
            </Field>

            {targetUser.schools.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Escolas vinculadas atualmente</h3>
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
