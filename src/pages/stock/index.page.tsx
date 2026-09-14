import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { Package, Plus, Search, Trash2 } from 'lucide-react';

import { cookieManager, logError } from '@/_base/utils';
import { useAsyncCallback, useInputHandler } from '@/_base/hooks';
import { getProfile } from '@/_base/services/user';
import { createStockItem, listStockItems, removeStockItem, updateStockItem } from '@/_base/services/stock';
import { listPermissions } from '@/_base/services/permissions';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { EMPTY_STOCK_ITEM_DATA, IRegisterStockItemParams, IStockItem, IUpdateStockItemParams, registerStockItemSchema } from '@/_base/interfaces/stock';
import { IHubPermission } from '@/_base/interfaces/permission';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, PrimaryButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, TextField, MultiSelect, FileField } from '@/components/ui/form-controls';
import { CancelButton, SubmitButton, GhostButton } from '@/components/ui/form-buttons';

interface IProps {
  user: IHubUser;
}

const BRAND_CLASS = 'text-brand-estoque';
const BRAND_BG_CLASS = 'bg-brand-estoque/10';
const RING_CLASS = 'focus:ring-brand-estoque/30 focus:border-brand-estoque';

async function uploadAndGetPath(file: File): Promise<string> {
  const { link, path } = await getPresignedUrl(file.type, 'store-maker');
  await uploadFile(link, file);
  return path;
}

type StockRow = {
  id: string;
  name: string;
  price: string;
};

const formatStockRow = (item: IStockItem): StockRow => ({
  id: item.id,
  name: item.name,
  price: item.price,
});

const Stock: React.FC<IProps> = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [stockItems, setStockItems] = useState<IStockItem[]>([]);
  const [permissions, setPermissions] = useState<IHubPermission[]>([]);

  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [stockSearch, setStockSearch] = useState('');

  const toast = useToast();

  const [targetItem, setTargetItem] = useState<IStockItem | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [removeItemOpen, setRemoveItemOpen] = useState(false);

  const {
    data: itemData,
    errors: itemErrors,
    setErrors: setItemErrors,
    onInputChange: onItemInputChange,
    submit: submitItem,
    setData: setItemData,
  } = useInputHandler({ data: EMPTY_STOCK_ITEM_DATA, schema: registerStockItemSchema });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ results: itemRes }, { results: permissionRes }] = await Promise.all([listStockItems(), listPermissions()]);
      setStockItems(itemRes);
      setPermissions(permissionRes);
    } catch {
      toast({ status: `error`, description: `Ocorreu um erro` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => setStockRows(stockItems.map(formatStockRow)), [stockItems]);

  const resetCreateForm = () => {
    setItemData(EMPTY_STOCK_ITEM_DATA);
    setItemErrors({} as any);
    setNewImage(null);
    setNewVideo(null);
  };

  const handleOpenItemModal = (id: string) => {
    const item = stockItems.find((e) => e.id === id);
    if (item) {
      setTargetItem(item);
      setNewImage(null);
      setNewVideo(null);
    }
  };

  const handleUpdateItem = useAsyncCallback(
    async () => {
      if (!targetItem) return;
      setIsLoading(true);

      const dto: IUpdateStockItemParams = {
        id: targetItem.id,
        name: targetItem.name,
        description: targetItem.description,
        price: targetItem.price,
        permissions: targetItem.content_permission_links?.map((e) => e.hub_permission_id) || [],
        reusable: targetItem.reusable,
        metadata: targetItem.metadata,
      };

      if (newImage) dto.picture = await uploadAndGetPath(newImage);
      if (newVideo) dto.video_url = await uploadAndGetPath(newVideo);

      const updatedItem = await updateStockItem(dto);

      setStockItems((s) => s.map((e) => (e.id === updatedItem.id ? { ...targetItem, ...updatedItem } : e)));
      setTargetItem(null);
      setNewImage(null);
      setNewVideo(null);

      toast({ description: 'Item atualizado!', status: 'success' });
    },
    [targetItem, newImage, newVideo],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterItem = useAsyncCallback(
    async () => {
      if (!newImage) {
        toast({ status: `error`, title: `Imagem obrigatória` });
        return;
      }
      setIsLoading(true);

      const payload: IRegisterStockItemParams = { ...itemData };
      payload.picture = await uploadAndGetPath(newImage);
      if (newVideo) payload.video_url = await uploadAndGetPath(newVideo);

      const newItem = await createStockItem(payload);

      setStockItems((s) => [newItem, ...s]);
      resetCreateForm();
      setCreateItemOpen(false);

      toast({ description: 'Item criado!', status: 'success' });
    },
    [itemData, newImage, newVideo],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveItem = useAsyncCallback(
    async () => {
      if (!targetItem) return;
      setIsLoading(true);

      await removeStockItem(targetItem.id);

      setStockItems((s) => s.filter((e) => e.id !== targetItem.id));
      setTargetItem(null);
      setRemoveItemOpen(false);
      toast({ description: 'Item removido!', status: 'success' });
    },
    [targetItem],
    false,
    () => setIsLoading(false),
  );

  const filteredStock = stockRows.filter((row) => {
    if (!stockSearch.trim()) return true;
    const q = stockSearch.trim().toLowerCase();
    return row.name?.toLowerCase().includes(q);
  });

  const permissionOptions = permissions.map((p) => ({ value: p.id, label: p.title }));

  const stockColumns: Column<StockRow>[] = [
    {
      key: 'nome',
      header: 'Nome',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-brand-estoque/10 grid place-items-center shrink-0">
            <Package className="size-4 text-brand-estoque" />
          </div>
          <span className="font-medium text-zinc-900">{r.name}</span>
        </div>
      ),
    },
    { key: 'preco', header: 'Preço', render: (r) => <span className="text-zinc-600">{r.price}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenItemModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="font-sans">
      <PageHeader
        title="Estoque Maker"
        description="Gerencie os itens disponíveis na loja maker."
        actions={
          <PrimaryButton onClick={() => setCreateItemOpen(true)}>
            <Plus className="size-4" /> Novo Item
          </PrimaryButton>
        }
      />

      <div className="mb-4 max-w-xs relative">
        <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={stockSearch}
          onChange={(e) => setStockSearch(e.target.value)}
          placeholder="Buscar por nome"
          className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
        />
      </div>
      <DataTable columns={stockColumns} data={filteredStock} empty={isLoading ? 'Carregando...' : 'Nenhum item cadastrado.'} />

      {/* ------------------- Item view / edit modal ------------------- */}
      <Modal
        open={!!targetItem}
        onClose={() => setTargetItem(null)}
        title={targetItem?.name ?? 'Item'}
        width="max-w-2xl"
        footer={
          <>
            <CancelButton onClick={() => setTargetItem(null)} />
            <SubmitButton onClick={handleUpdateItem} disabled={!targetItem?.name?.trim()} brandClass="bg-brand-estoque">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetItem && (
          <div className="space-y-5">
            <Field label="Nome" required>
              <TextField value={targetItem.name} onChange={(v) => setTargetItem((e) => (e ? { ...e, name: v } : e))} />
            </Field>
            <Field label="Descrição">
              <TextField
                value={targetItem.description ?? ''}
                onChange={(v) => setTargetItem((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>
            <Field label="Permissões" error={itemErrors.permissions}>
              <MultiSelect
                options={permissionOptions}
                value={targetItem.content_permission_links?.map((l) => l.hub_permission_id) ?? []}
                onChange={(ids) =>
                  setTargetItem((e) =>
                    e
                      ? {
                          ...e,
                          content_permission_links: ids.map(
                            (hub_permission_id) => ({ hub_permission_id, permission: permissions.find((p) => p.id === hub_permission_id) }) as any,
                          ),
                        }
                      : e,
                  )
                }
                placeholder="Selecione as permissões"
                brandClass={BRAND_CLASS}
                brandBgClass={BRAND_BG_CLASS}
                ringClass={RING_CLASS}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Thumbnail">
                <div className="space-y-2">
                  {targetItem.picture && (
                    <img src={targetItem.picture} alt="Thumbnail atual" className="h-24 rounded-lg ring-1 ring-border object-cover" />
                  )}
                  <FileField accept="image/*" fileName={newImage?.name} onChange={setNewImage} brandClass={BRAND_CLASS} />
                </div>
              </Field>
              <Field label="Vídeo">
                <div className="space-y-2">
                  {targetItem.video_url && (
                    <video controls className="h-24 rounded-lg ring-1 ring-border">
                      <source src={targetItem.video_url} type="video/mp4" />
                    </video>
                  )}
                  <FileField accept="video/*" fileName={newVideo?.name} onChange={setNewVideo} brandClass={BRAND_CLASS} />
                </div>
              </Field>
            </div>

            <div className="pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemoveItemOpen(true)}>
                <Trash2 className="size-4" /> Excluir item
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeItemOpen}
        onClose={() => setRemoveItemOpen(false)}
        onConfirm={handleRemoveItem}
        title={`Remover ${targetItem?.name ?? 'item'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* ------------------- Item create modal ------------------- */}
      <Modal
        open={createItemOpen}
        onClose={() => {
          resetCreateForm();
          setCreateItemOpen(false);
        }}
        title="Registrar item no estoque"
        width="max-w-2xl"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetCreateForm();
                setCreateItemOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitItem(handleRegisterItem)}
              disabled={!itemData.name?.trim() || !newImage}
              brandClass="bg-brand-estoque"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Nome" required error={itemErrors.name}>
            <TextField
              value={itemData.name}
              onChange={(v) => onItemInputChange('name', v)}
              placeholder="Ex: Kit de sensores"
              error={itemErrors.name}
            />
          </Field>
          <Field label="Descrição" error={itemErrors.description}>
            <TextField
              value={itemData.description ?? ''}
              onChange={(v) => onItemInputChange('description', v)}
              placeholder="Descrição opcional"
              error={itemErrors.description}
            />
          </Field>
          <Field label="Permissões" error={itemErrors.permissions}>
            <MultiSelect
              options={permissionOptions}
              value={itemData.permissions}
              onChange={(v) => onItemInputChange('permissions', v)}
              placeholder="Selecione as permissões"
              brandClass={BRAND_CLASS}
              brandBgClass={BRAND_BG_CLASS}
              ringClass={RING_CLASS}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Thumbnail" required>
              <FileField accept="image/*" fileName={newImage?.name} onChange={setNewImage} brandClass={BRAND_CLASS} />
            </Field>
            <Field label="Vídeo">
              <FileField accept="video/*" fileName={newVideo?.name} onChange={setNewVideo} brandClass={BRAND_CLASS} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Stock;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'stock';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Estoque Maker' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
