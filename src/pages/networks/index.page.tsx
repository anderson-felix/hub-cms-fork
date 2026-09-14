import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { Network, Plus, RotateCcw, Search, Trash2, HelpCircle } from 'lucide-react';

import { cookieManager, logError } from '@/_base/utils';
import { useAsyncCallback, useInputHandler } from '@/_base/hooks';
import { getProfile } from '@/_base/services/user';
import { createSchoolGroup, listSchoolGroups, removeSchool, resetProjectsFromSchoolGroup, updateSchoolGroup } from '@/_base/services/schoolGroup';
import { EMPTY_SCHOOL_GROUP_DATA, IHubSchoolGroup, registerSchoolGroupSchema } from '@/_base/interfaces/schoolGroup';
import { IHubPermission } from '@/_base/interfaces/permission';
import { listPermissions } from '@/_base/services/permissions';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, PrimaryButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, TextField, MultiSelect } from '@/components/ui/form-controls';
import { Toggle } from '@/components/ui/form-controls';
import { CancelButton, SubmitButton, GhostButton } from '@/components/ui/form-buttons';

interface IProps {
  user: IHubUser;
}

type DataType = {
  id: string;
  code: string;
  school_group_name: string;
  school_quantity: string;
};

const formatTableData = (schoolGroup: IHubSchoolGroup): DataType => ({
  id: schoolGroup.id,
  code: schoolGroup.code,
  school_quantity: `${schoolGroup.schools?.length ?? 0}`,
  school_group_name: schoolGroup.display_name,
});

const RESTRICTION_HELP =
  'Uma rede com restrição de conteúdo não tem acesso a items sem permissões, e consegue visualizar apenas items que possuam as mesmas permissões que a rede.';

const Networks: React.FC<IProps> = () => {
  const [targetSchoolGroup, setTargetSchoolGroup] = useState<IHubSchoolGroup | null>(null);
  const [permissions, setPermissions] = useState<IHubPermission[]>([]);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [schoolGroups, setSchoolGroups] = useState<IHubSchoolGroup[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  const toast = useToast();
  const { data, errors, setErrors, onInputChange, submit, setData } = useInputHandler({
    data: EMPTY_SCHOOL_GROUP_DATA,
    schema: registerSchoolGroupSchema,
  });
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [{ results: groupRes }, { results: permissionRes }] = await Promise.all([listSchoolGroups(), listPermissions()]);
        setPermissions(permissionRes);
        setSchoolGroups(groupRes);
      } catch {
        toast({ status: `error`, description: `Não foi possível listar as redes` });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setTableData(schoolGroups.map(formatTableData));
  }, [schoolGroups]);

  const permissionOptions = permissions.map((p) => ({ value: p.id, label: p.title }));

  const handleOpenSchoolGroupModal = (code: string) => {
    const school = schoolGroups.find((e) => e.code === code);
    if (school) setTargetSchoolGroup(school);
  };

  const handleUpdateSchoolGroup = useAsyncCallback(
    async () => {
      if (!targetSchoolGroup) return;
      setIsLoading(true);

      const updatedSchoolGroup = await updateSchoolGroup({
        id: targetSchoolGroup.id,
        display_name: targetSchoolGroup.display_name,
        description: targetSchoolGroup.description,
        permissions: targetSchoolGroup.usage_permission_links?.map((link) => link.permission.id),
        metadata: targetSchoolGroup.metadata,
      });

      setSchoolGroups((s) => s.map((e) => (e.id === updatedSchoolGroup.id ? { ...targetSchoolGroup, ...updatedSchoolGroup } : e)));
      setTargetSchoolGroup(null);

      toast({ description: 'Rede atualizada!', status: 'success' });
    },
    [targetSchoolGroup],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterSchoolGroup = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const newSchoolGroup = await createSchoolGroup(data);
      newSchoolGroup.usage_permission_links = data.permissions?.map((id) => ({ id, permission: permissions.find((p) => p.id === id) }) as any) || [];

      setSchoolGroups((s) => [newSchoolGroup, ...s]);
      setData(EMPTY_SCHOOL_GROUP_DATA);
      setErrors({} as any);
      setCreateOpen(false);
    },
    [data],
    false,
    () => setIsLoading(false),
  );

  const handleResetProjects = useAsyncCallback(
    async () => {
      if (!targetSchoolGroup) return;
      setIsLoading(true);

      await resetProjectsFromSchoolGroup(targetSchoolGroup.id);

      setResetModalOpen(false);
      toast({ status: `success`, title: `Projetos de fábrica resetados com sucesso`, position: `top-right` });
    },
    [targetSchoolGroup],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveSchoolGroup = useAsyncCallback(
    async () => {
      if (!targetSchoolGroup) return;
      setIsLoading(true);

      await removeSchool(targetSchoolGroup.id);

      setSchoolGroups((s) => s.filter((e) => e.id !== targetSchoolGroup.id));
      setTargetSchoolGroup(null);
      setRemoveModalOpen(false);
      toast({ status: `success`, description: `Rede removida com sucesso` });
    },
    [targetSchoolGroup],
    false,
    () => setIsLoading(false),
  );

  const filteredData = tableData.filter((row) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return row.code.toLowerCase().includes(q) || row.school_group_name.toLowerCase().includes(q);
  });

  const columns: Column<DataType>[] = [
    {
      key: 'nome',
      header: 'Rede',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-brand-redes/10 grid place-items-center">
            <Network className="size-4 text-brand-redes" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">{r.school_group_name}</span>
            <span className="text-[11px] text-zinc-400">Código {r.code}</span>
          </div>
        </div>
      ),
    },
    { key: 'escolas', header: 'Escolas', render: (r) => <span className="text-zinc-700 tabular-nums">{r.school_quantity}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenSchoolGroupModal(r.code)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="font-sans">
      <PageHeader
        title="Redes"
        description="Gerencie as redes educacionais cadastradas na plataforma."
        actions={
          <PrimaryButton onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Nova Rede
          </PrimaryButton>
        }
      />

      <div className="mb-4 max-w-xs relative">
        <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código ou nome"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-redes/30 focus:border-brand-redes transition"
        />
      </div>

      <DataTable columns={columns} data={filteredData} empty={isLoading ? 'Carregando...' : 'Nenhuma rede cadastrada.'} />

      {/* View / Edit modal */}
      <Modal
        open={!!targetSchoolGroup}
        onClose={() => setTargetSchoolGroup(null)}
        title={targetSchoolGroup?.display_name ?? 'Rede'}
        width="max-w-2xl"
        footer={
          <>
            <CancelButton onClick={() => setTargetSchoolGroup(null)} />
            <SubmitButton onClick={handleUpdateSchoolGroup} disabled={!targetSchoolGroup?.display_name?.trim()}>
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetSchoolGroup && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome" required>
                <TextField
                  value={targetSchoolGroup.display_name}
                  onChange={(v) => setTargetSchoolGroup((e) => (e ? { ...e, display_name: v } : e))}
                />
              </Field>
              <Field label="Código de acesso">
                <TextField value={targetSchoolGroup.code} readOnly />
              </Field>
            </div>
            <Field label="Descrição">
              <TextField
                value={targetSchoolGroup.description ?? ''}
                onChange={(v) => setTargetSchoolGroup((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>
            <Field label="Permissões">
              <MultiSelect
                options={permissionOptions}
                value={targetSchoolGroup.usage_permission_links?.map((l) => l.permission.id) ?? []}
                onChange={(ids) =>
                  setTargetSchoolGroup((e) =>
                    e ? { ...e, usage_permission_links: ids.map((id) => ({ id, permission: permissions.find((p) => p.id === id) }) as any) } : e,
                  )
                }
                placeholder="Selecione as permissões"
              />
            </Field>
            <div className="flex items-center gap-3">
              <span title={RESTRICTION_HELP}>
                <HelpCircle className="size-4 text-brand-redes" />
              </span>
              <Toggle
                checked={!!targetSchoolGroup.metadata?.permission_restrictions?.includes('*')}
                onChange={(checked) =>
                  setTargetSchoolGroup((e) => (e ? { ...e, metadata: { permission_restrictions: checked ? ['*'] : [] } } : e))
                }
              />
              <span className="text-sm text-foreground">Restringir acesso de conteúdo</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <GhostButton onClick={() => setResetModalOpen(true)}>
                <RotateCcw className="size-4" /> Resetar projetos
              </GhostButton>
              <GhostButton tone="danger" onClick={() => setRemoveModalOpen(true)}>
                <Trash2 className="size-4" /> Excluir rede
              </GhostButton>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Escolas desta rede</h3>
              <div className="rounded-xl ring-1 ring-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Escola</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Código</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {targetSchoolGroup.schools.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                          Nenhuma escola vinculada a esta rede.
                        </td>
                      </tr>
                    ) : (
                      targetSchoolGroup.schools.map((school) => (
                        <tr key={school.id} className="hover:bg-muted/60">
                          <td className="px-4 py-2.5 text-foreground">{school.display_name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{school.code}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetProjects}
        title={`Resetar projetos de fábrica`}
        description={`Resetar todos os projetos de fábrica na rede ${targetSchoolGroup?.display_name}? Essa ação é irreversível.`}
        confirmLabel="Resetar"
        tone="neutral"
      />
      <ConfirmDialog
        open={removeModalOpen}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={handleRemoveSchoolGroup}
        title={`Remover ${targetSchoolGroup?.display_name ?? 'rede'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setData(EMPTY_SCHOOL_GROUP_DATA);
          setErrors({} as any);
          setCreateOpen(false);
        }}
        title="Registrar rede"
        footer={
          <>
            <CancelButton
              onClick={() => {
                setData(EMPTY_SCHOOL_GROUP_DATA);
                setErrors({} as any);
                setCreateOpen(false);
              }}
            />
            <SubmitButton onClick={() => submit(handleRegisterSchoolGroup)} disabled={!data.display_name?.trim()}>
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Nome" required error={errors.display_name}>
            <TextField
              value={data.display_name ?? ''}
              onChange={(v) => onInputChange('display_name', v)}
              placeholder="Ex: Rede Sudeste Digital"
              error={errors.display_name}
            />
          </Field>
          <Field label="Descrição" error={errors.description}>
            <TextField
              value={data.description ?? ''}
              onChange={(v) => onInputChange('description', v)}
              placeholder="Descrição opcional"
              error={errors.description}
            />
          </Field>
          <Field label="Permissões">
            <MultiSelect
              options={permissionOptions}
              value={data.permissions ?? []}
              onChange={(v) => onInputChange('permissions', v)}
              placeholder="Selecione as permissões"
            />
          </Field>
          <div className="flex items-center gap-3 pt-1">
            <span title={RESTRICTION_HELP}>
              <HelpCircle className="size-4 text-brand-redes" />
            </span>
            <Toggle
              checked={!!data.metadata?.permission_restrictions?.includes('*')}
              onChange={(checked) => onInputChange('metadata', { permission_restrictions: checked ? ['*'] : [] })}
            />
            <span className="text-sm text-foreground">Restringir acesso de conteúdo</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Networks;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'networks';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return {
      props: {
        admin,
        selectedPage,
        pageTitle: 'Redes',
      },
    };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);

    return {
      redirect: { destination: '/login', permanent: false },
    };
  }
};
