import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { Plus, Search, Trash2 } from 'lucide-react';

import { cookieManager, logError } from '@/_base/utils';
import { useAsyncCallback, useInputHandler } from '@/_base/hooks';
import { getProfile } from '@/_base/services/user';
import { createPermission, listPermissions, removePermission, updatePermission } from '@/_base/services/permissions';
import { EMPTY_PERMISSION_DATA, IHubPermission, registerPermissionSchema } from '@/_base/interfaces/permission';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, PrimaryButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, TextField } from '@/components/ui/form-controls';
import { CancelButton, SubmitButton, GhostButton } from '@/components/ui/form-buttons';

interface IProps {
  user: IHubUser;
}

type PermissionRow = {
  id: string;
  title: string;
  description: string;
};

const formatPermissionRow = (permission: IHubPermission): PermissionRow => ({
  id: permission.id,
  title: permission.title,
  description: permission.description,
});

const Permissions: React.FC<IProps> = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [permissions, setPermissions] = useState<IHubPermission[]>([]);
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');

  const toast = useToast();

  const [targetPermission, setTargetPermission] = useState<IHubPermission | null>(null);
  const [createPermissionOpen, setCreatePermissionOpen] = useState(false);
  const [removePermissionOpen, setRemovePermissionOpen] = useState(false);

  const {
    data: permissionData,
    errors: permissionErrors,
    setErrors: setPermissionErrors,
    onInputChange: onPermissionInputChange,
    submit: submitPermission,
    setData: setPermissionData,
  } = useInputHandler({ data: EMPTY_PERMISSION_DATA, schema: registerPermissionSchema });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { results } = await listPermissions();
      setPermissions(results);
    } catch {
      toast({ status: `error`, description: `Não foi possível listar as permissões` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => setPermissionRows(permissions.map(formatPermissionRow)), [permissions]);

  const resetCreateForm = () => {
    setPermissionData(EMPTY_PERMISSION_DATA);
    setPermissionErrors({} as any);
  };

  const handleOpenPermissionModal = (id: string) => {
    const permission = permissions.find((e) => e.id === id);
    if (permission) setTargetPermission(permission);
  };

  const handleUpdatePermission = useAsyncCallback(
    async () => {
      if (!targetPermission) return;
      setIsLoading(true);

      const updatedPermission = await updatePermission({
        id: targetPermission.id,
        title: targetPermission.title,
        description: targetPermission.description,
      });

      setPermissions((s) => s.map((e) => (e.id === updatedPermission.id ? { ...targetPermission, ...updatedPermission } : e)));
      setTargetPermission(null);

      toast({ description: 'Permissão atualizada!', status: 'success' });
    },
    [targetPermission],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterPermission = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const newPermission = await createPermission(permissionData);

      setPermissions((s) => [newPermission, ...s]);
      resetCreateForm();
      setCreatePermissionOpen(false);

      toast({ description: 'Permissão criada!', status: 'success' });
    },
    [permissionData],
    false,
    () => setIsLoading(false),
  );

  const handleRemovePermission = useAsyncCallback(
    async () => {
      if (!targetPermission) return;
      setIsLoading(true);

      await removePermission(targetPermission.id);

      setPermissions((s) => s.filter((e) => e.id !== targetPermission.id));
      setTargetPermission(null);
      setRemovePermissionOpen(false);
      toast({ description: 'Permissão removida!', status: 'success' });
    },
    [targetPermission],
    false,
    () => setIsLoading(false),
  );

  const filteredPermissions = permissionRows.filter((row) => {
    if (!permissionSearch.trim()) return true;
    const q = permissionSearch.trim().toLowerCase();
    return row.title?.toLowerCase().includes(q) || row.description?.toLowerCase().includes(q);
  });

  const permissionColumns: Column<PermissionRow>[] = [
    { key: 'nome', header: 'Nome', render: (r) => <span className="font-medium text-zinc-900">{r.title}</span> },
    { key: 'descricao', header: 'Descrição', render: (r) => <span className="text-zinc-600">{r.description || '-'}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenPermissionModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="font-sans">
      <PageHeader
        title="Permissões"
        description="Gerencie as permissões de acesso a conteúdos da plataforma."
        actions={
          <PrimaryButton onClick={() => setCreatePermissionOpen(true)}>
            <Plus className="size-4" /> Nova Permissão
          </PrimaryButton>
        }
      />

      <div className="mb-4 max-w-xs relative">
        <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={permissionSearch}
          onChange={(e) => setPermissionSearch(e.target.value)}
          placeholder="Buscar por nome ou descrição"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-permissoes/30 focus:border-brand-permissoes transition"
        />
      </div>
      <DataTable columns={permissionColumns} data={filteredPermissions} empty={isLoading ? 'Carregando...' : 'Nenhuma permissão cadastrada.'} />

      {/* ------------------- Permission view / edit modal ------------------- */}
      <Modal
        open={!!targetPermission}
        onClose={() => setTargetPermission(null)}
        title={targetPermission?.title ?? 'Permissão'}
        footer={
          <>
            <CancelButton onClick={() => setTargetPermission(null)} />
            <SubmitButton onClick={handleUpdatePermission} disabled={!targetPermission?.title?.trim()} brandClass="bg-brand-permissoes">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetPermission && (
          <div className="space-y-5">
            <Field label="Nome" required>
              <TextField value={targetPermission.title} onChange={(v) => setTargetPermission((e) => (e ? { ...e, title: v } : e))} />
            </Field>
            <Field label="Descrição">
              <TextField
                value={targetPermission.description ?? ''}
                onChange={(v) => setTargetPermission((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>
            <div className="pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemovePermissionOpen(true)}>
                <Trash2 className="size-4" /> Excluir permissão
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removePermissionOpen}
        onClose={() => setRemovePermissionOpen(false)}
        onConfirm={handleRemovePermission}
        title={`Remover ${targetPermission?.title ?? 'permissão'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* ------------------- Permission create modal ------------------- */}
      <Modal
        open={createPermissionOpen}
        onClose={() => {
          resetCreateForm();
          setCreatePermissionOpen(false);
        }}
        title="Registrar permissão"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetCreateForm();
                setCreatePermissionOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitPermission(handleRegisterPermission)}
              disabled={!permissionData.title?.trim()}
              brandClass="bg-brand-permissoes"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Nome" required error={permissionErrors.title}>
            <TextField
              value={permissionData.title}
              onChange={(v) => onPermissionInputChange('title', v)}
              placeholder="Ex: Rede Positivo"
              error={permissionErrors.title}
            />
          </Field>
          <Field label="Descrição" error={permissionErrors.description}>
            <TextField
              value={permissionData.description ?? ''}
              onChange={(v) => onPermissionInputChange('description', v)}
              placeholder="Descrição opcional"
              error={permissionErrors.description}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

export default Permissions;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'permissions';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Permissões' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
