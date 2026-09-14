import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import moment from 'moment';
import { PlayCircle, Plus, Search, Trash2 } from 'lucide-react';

import { cookieManager, formatClassGrade, formatReadableId, logError, scopeLabelMapper, sortGrades } from '@/_base/utils';
import { useAsyncCallback, useInputHandler } from '@/_base/hooks';
import { getProfile } from '@/_base/services/user';
import { createVideo, listVideos, removeVideo, updateVideo } from '@/_base/services/video';
import { createVideoCategory, listVideoCategories, removeVideoCategory, updateVideoCategory } from '@/_base/services/videoCategory';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { getAvailableGrades } from '@/_base/services/admin';
import { listPermissions } from '@/_base/services/permissions';
import { IHubVideo, IUpdateHubVideoParams, EMPTY_VIDEO_SCHEMA_DATA, hubVideoSchema } from '@/_base/interfaces/video';
import { IHubVideoCategory, EMPTY_VIDEO_CATEGORY_SCHEMA_DATA, hubVideoCategorySchema } from '@/_base/interfaces/videoCategory';
import { IHubPermission } from '@/_base/interfaces/permission';
import { HubContentScope } from '@/_base/interfaces/shared';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, PrimaryButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, TextField, SelectField, MultiSelect, FileField, RadioGroup } from '@/components/ui/form-controls';
import { CancelButton, SubmitButton, GhostButton } from '@/components/ui/form-buttons';
import { Tabs } from '@/components/ui/tabs';

interface IProps {
  user: IHubUser;
}

const SCOPE_OPTIONS = [
  { value: 'teacher', label: 'Professor' },
  { value: 'student', label: 'Aluno' },
  { value: '', label: 'Formação' },
];

async function uploadAndGetPath(file: File): Promise<string> {
  const { link, path } = await getPresignedUrl(file.type, 'videos');
  await uploadFile(link, file);
  return path;
}

type VideoRow = {
  id: string;
  code: string;
  title: string;
  category_name: string;
  grades_display: string;
};

const formatVideoRow = (video: IHubVideo): VideoRow => ({
  id: video.id,
  code: formatReadableId(video.readable_id),
  title: video.title,
  category_name: video.category?.display_name || '-',
  grades_display: video.grades?.map(formatClassGrade).join(' · ') || '-',
});

type CategoryRow = {
  id: string;
  name: string;
  scope_label: string;
  video_quantity: string;
  created_at: string;
};

const formatCategoryRow = (category: IHubVideoCategory): CategoryRow => ({
  id: category.id,
  name: category.display_name,
  scope_label: category.scope ? scopeLabelMapper[category.scope] : 'Formação',
  video_quantity: `${category.videos?.length ?? 0}`,
  created_at: moment(category.created_at).format('DD/MM/YYYY'),
});

const Videos: React.FC<IProps> = () => {
  const [tab, setTab] = useState<'videos' | 'categorias'>('videos');
  const [isLoading, setIsLoading] = useState(false);

  const [videos, setVideos] = useState<IHubVideo[]>([]);
  const [categories, setCategories] = useState<IHubVideoCategory[]>([]);
  const [permissions, setPermissions] = useState<IHubPermission[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  const [videoRows, setVideoRows] = useState<VideoRow[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);

  const [videoSearch, setVideoSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const toast = useToast();

  // ---- Videos ----
  const [targetVideo, setTargetVideo] = useState<IHubVideo | null>(null);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [createVideoOpen, setCreateVideoOpen] = useState(false);
  const [removeVideoOpen, setRemoveVideoOpen] = useState(false);

  const {
    data: videoData,
    errors: videoErrors,
    setErrors: setVideoErrors,
    onInputChange: onVideoInputChange,
    submit: submitVideo,
    setData: setVideoData,
  } = useInputHandler({ data: EMPTY_VIDEO_SCHEMA_DATA, schema: hubVideoSchema });

  // ---- Categories ----
  const [targetCategory, setTargetCategory] = useState<IHubVideoCategory | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [removeCategoryOpen, setRemoveCategoryOpen] = useState(false);

  const {
    data: categoryData,
    errors: categoryErrors,
    setErrors: setCategoryErrors,
    onInputChange: onCategoryInputChange,
    submit: submitCategory,
    setData: setCategoryData,
  } = useInputHandler({ data: EMPTY_VIDEO_CATEGORY_SCHEMA_DATA, schema: hubVideoCategorySchema });

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [{ results: videoRes }, { results: categoryRes }, grades, { results: permissionRes }] = await Promise.all([
          listVideos(),
          listVideoCategories(),
          getAvailableGrades(),
          listPermissions(),
        ]);
        setVideos(videoRes);
        setCategories(categoryRes);
        setPermissions(permissionRes);
        setAvailableGrades(sortGrades(grades));
      } catch {
        toast({ status: `error`, description: `Ocorreu um erro` });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => setVideoRows(videos.map(formatVideoRow)), [videos]);
  useEffect(() => setCategoryRows(categories.map(formatCategoryRow)), [categories]);

  const resetVideoCreateForm = () => {
    setVideoData(EMPTY_VIDEO_SCHEMA_DATA);
    setVideoErrors({} as any);
    setNewThumbnail(null);
    setNewFile(null);
  };

  const resetCategoryCreateForm = () => {
    setCategoryData(EMPTY_VIDEO_CATEGORY_SCHEMA_DATA);
    setCategoryErrors({} as any);
  };

  const handleOpenVideoModal = (id: string) => {
    const video = videos.find((e) => e.id === id);
    if (video) {
      setTargetVideo(video);
      setNewThumbnail(null);
      setNewFile(null);
    }
  };

  const handleUpdateVideo = useAsyncCallback(
    async () => {
      if (!targetVideo) return;
      setIsLoading(true);

      const dto: IUpdateHubVideoParams = {
        id: targetVideo.id,
        title: targetVideo.title,
        description: targetVideo.description || undefined,
        permissions: targetVideo.content_permission_links?.map((link) => link.permission.id),
      };
      if (newThumbnail) dto.thumbnail = await uploadAndGetPath(newThumbnail);
      if (newFile) dto.file = await uploadAndGetPath(newFile);

      const updatedVideo = await updateVideo(dto);

      setVideos((s) => s.map((e) => (e.id === updatedVideo.id ? { ...targetVideo, ...updatedVideo } : e)));
      setTargetVideo(null);
      setNewThumbnail(null);
      setNewFile(null);

      toast({ description: 'Vídeo atualizado!', status: 'success' });
    },
    [targetVideo, newThumbnail, newFile],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterVideo = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const payload = { ...videoData };
      if (newThumbnail) payload.thumbnail = await uploadAndGetPath(newThumbnail);
      if (newFile) payload.file = await uploadAndGetPath(newFile);

      const newVideo = await createVideo(payload);

      setVideos((s) => [newVideo, ...s]);
      resetVideoCreateForm();
      setCreateVideoOpen(false);

      toast({ description: 'Vídeo criado!', status: 'success' });
    },
    [videoData, newThumbnail, newFile],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveVideo = useAsyncCallback(
    async () => {
      if (!targetVideo) return;
      setIsLoading(true);

      await removeVideo(targetVideo.id);

      setVideos((s) => s.filter((e) => e.id !== targetVideo.id));
      setTargetVideo(null);
      setRemoveVideoOpen(false);
      toast({ description: 'Vídeo removido!', status: 'success' });
    },
    [targetVideo],
    false,
    () => setIsLoading(false),
  );

  const handleOpenCategoryModal = (id: string) => {
    const category = categories.find((e) => e.id === id);
    if (category) setTargetCategory(category);
  };

  const handleUpdateCategory = useAsyncCallback(
    async () => {
      if (!targetCategory) return;
      setIsLoading(true);

      const updatedCategory = await updateVideoCategory({ id: targetCategory.id, display_name: targetCategory.display_name });

      setCategories((s) => s.map((e) => (e.id === updatedCategory.id ? { ...targetCategory, ...updatedCategory } : e)));
      setTargetCategory(null);

      toast({ description: 'Categoria atualizada!', status: 'success' });
    },
    [targetCategory],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterCategory = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const newCategory = await createVideoCategory(categoryData);

      setCategories((s) => [newCategory, ...s]);
      resetCategoryCreateForm();
      setCreateCategoryOpen(false);

      toast({ description: 'Categoria criada!', status: 'success' });
    },
    [categoryData],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveCategory = useAsyncCallback(
    async () => {
      if (!targetCategory) return;
      setIsLoading(true);

      await removeVideoCategory(targetCategory.id);

      setCategories((s) => s.filter((e) => e.id !== targetCategory.id));
      setTargetCategory(null);
      setRemoveCategoryOpen(false);
      toast({ description: 'Categoria removida!', status: 'success' });
    },
    [targetCategory],
    false,
    () => setIsLoading(false),
  );

  const filteredVideos = videoRows.filter((row) => {
    if (!videoSearch.trim()) return true;
    const q = videoSearch.trim().toLowerCase();
    return row.code.toLowerCase().includes(q) || row.title?.toLowerCase().includes(q) || row.category_name?.toLowerCase().includes(q);
  });

  const filteredCategories = categoryRows.filter((row) => {
    if (!categorySearch.trim()) return true;
    const q = categorySearch.trim().toLowerCase();
    return row.name?.toLowerCase().includes(q) || row.scope_label?.toLowerCase().includes(q);
  });

  const permissionOptions = permissions.map((p) => ({ value: p.id, label: p.title }));
  const gradeOptions = availableGrades.map((g) => ({ value: g, label: formatClassGrade(g) }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.display_name }));

  const videoColumns: Column<VideoRow>[] = [
    {
      key: 'titulo',
      header: 'Vídeo',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-9 rounded bg-brand-videos/10 grid place-items-center shrink-0">
            <PlayCircle className="size-4 text-brand-videos" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">{r.title}</span>
            <span className="text-[11px] text-zinc-400">Código {r.code}</span>
          </div>
        </div>
      ),
    },
    { key: 'categoria', header: 'Categoria', render: (r) => <span className="text-zinc-600">{r.category_name}</span> },
    { key: 'anos', header: 'Anos', render: (r) => <span className="text-zinc-600">{r.grades_display}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenVideoModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  const categoryColumns: Column<CategoryRow>[] = [
    { key: 'nome', header: 'Categoria', render: (r) => <span className="font-medium text-zinc-900">{r.name}</span> },
    { key: 'escopo', header: 'Escopo', render: (r) => <span className="text-zinc-600">{r.scope_label}</span> },
    { key: 'qtd', header: 'Vídeos vinculados', render: (r) => <span className="text-zinc-600 tabular-nums">{r.video_quantity}</span> },
    { key: 'criado', header: 'Criado em', render: (r) => <span className="text-zinc-500">{r.created_at}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenCategoryModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="font-sans">
      <PageHeader
        title="Vídeos"
        description="Adicione vídeos e vincule-os aos cursos da plataforma."
        actions={
          tab === 'videos' ? (
            <PrimaryButton onClick={() => setCreateVideoOpen(true)}>
              <Plus className="size-4" /> Novo Vídeo
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => setCreateCategoryOpen(true)}>
              <Plus className="size-4" /> Nova Categoria
            </PrimaryButton>
          )
        }
      />

      <Tabs
        items={[
          { value: 'videos', label: 'Vídeos' },
          { value: 'categorias', label: 'Categoria de vídeos' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'videos' | 'categorias')}
        brandClass="text-brand-videos"
      />

      {tab === 'videos' ? (
        <>
          <div className="mb-4 max-w-xs relative">
            <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={videoSearch}
              onChange={(e) => setVideoSearch(e.target.value)}
              placeholder="Buscar por código, título ou categoria"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-videos/30 focus:border-brand-videos transition"
            />
          </div>
          <DataTable columns={videoColumns} data={filteredVideos} empty={isLoading ? 'Carregando...' : 'Nenhum vídeo cadastrado.'} />
        </>
      ) : (
        <>
          <div className="mb-4 max-w-xs relative">
            <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Buscar por nome ou escopo"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-videos/30 focus:border-brand-videos transition"
            />
          </div>
          <DataTable
            columns={categoryColumns}
            data={filteredCategories}
            empty={isLoading ? 'Carregando...' : 'Nenhuma categoria cadastrada.'}
          />
        </>
      )}

      {/* Video view / edit modal */}
      <Modal
        open={!!targetVideo}
        onClose={() => setTargetVideo(null)}
        title={targetVideo?.title ?? 'Vídeo'}
        width="max-w-2xl"
        footer={
          <>
            <CancelButton onClick={() => setTargetVideo(null)} />
            <SubmitButton onClick={handleUpdateVideo} disabled={!targetVideo?.title?.trim()} brandClass="bg-brand-videos">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetVideo && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Categoria">
                <TextField value={targetVideo.category?.display_name ?? ''} readOnly />
              </Field>
              <Field label="Anos">
                <TextField value={targetVideo.grades?.map(formatClassGrade).join(', ') || '-'} readOnly />
              </Field>
            </div>
            <Field label="Nome" required>
              <TextField value={targetVideo.title} onChange={(v) => setTargetVideo((e) => (e ? { ...e, title: v } : e))} />
            </Field>
            <Field label="Descrição">
              <TextField
                value={targetVideo.description ?? ''}
                onChange={(v) => setTargetVideo((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>
            <Field label="Permissões">
              <MultiSelect
                options={permissionOptions}
                value={targetVideo.content_permission_links?.map((l) => l.permission.id) ?? []}
                onChange={(ids) =>
                  setTargetVideo((e) =>
                    e ? { ...e, content_permission_links: ids.map((id) => ({ id, permission: permissions.find((p) => p.id === id) }) as any) } : e,
                  )
                }
                placeholder="Selecione as permissões"
                brandClass="text-brand-videos"
                brandBgClass="bg-brand-videos/10"
                ringClass="focus:ring-brand-videos/30 focus:border-brand-videos"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Thumbnail">
                <div className="space-y-2">
                  {targetVideo.thumbnail && (
                    <img src={targetVideo.thumbnail} alt="Thumbnail atual" className="h-24 rounded-lg ring-1 ring-border object-cover" />
                  )}
                  <FileField accept="image/*" fileName={newThumbnail?.name} onChange={setNewThumbnail} brandClass="text-brand-videos" />
                </div>
              </Field>
              <Field label="Arquivo do vídeo">
                <div className="space-y-2">
                  {targetVideo.file && (
                    <video controls className="h-24 rounded-lg ring-1 ring-border">
                      <source src={targetVideo.file} type="video/mp4" />
                    </video>
                  )}
                  <FileField accept="video/*" fileName={newFile?.name} onChange={setNewFile} brandClass="text-brand-videos" />
                </div>
              </Field>
            </div>

            <div className="pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemoveVideoOpen(true)}>
                <Trash2 className="size-4" /> Excluir vídeo
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeVideoOpen}
        onClose={() => setRemoveVideoOpen(false)}
        onConfirm={handleRemoveVideo}
        title={`Remover ${targetVideo?.title ?? 'vídeo'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* Video create modal */}
      <Modal
        open={createVideoOpen}
        onClose={() => {
          resetVideoCreateForm();
          setCreateVideoOpen(false);
        }}
        title="Registrar vídeo"
        width="max-w-2xl"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetVideoCreateForm();
                setCreateVideoOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitVideo(handleRegisterVideo)}
              disabled={!videoData.title?.trim() || !videoData.category_id || !videoData.grades?.length}
              brandClass="bg-brand-videos"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Categoria" required error={videoErrors.category_id}>
              <SelectField
                value={videoData.category_id}
                onChange={(v) => onVideoInputChange('category_id', v)}
                options={categoryOptions}
                placeholder="Selecione a categoria"
                error={videoErrors.category_id}
              />
            </Field>
            <Field label="Anos" required error={videoErrors.grades as any}>
              <MultiSelect
                options={gradeOptions}
                value={videoData.grades}
                onChange={(v) => onVideoInputChange('grades', v)}
                placeholder="Selecione os anos"
                brandClass="text-brand-videos"
                brandBgClass="bg-brand-videos/10"
                ringClass="focus:ring-brand-videos/30 focus:border-brand-videos"
              />
            </Field>
          </div>
          <Field label="Nome" required error={videoErrors.title}>
            <TextField
              value={videoData.title}
              onChange={(v) => onVideoInputChange('title', v)}
              placeholder="Ex: Introdução ao Python"
              error={videoErrors.title}
            />
          </Field>
          <Field label="Descrição" error={videoErrors.description}>
            <TextField
              value={videoData.description}
              onChange={(v) => onVideoInputChange('description', v)}
              placeholder="Descrição opcional"
              error={videoErrors.description}
            />
          </Field>
          <Field label="Permissões">
            <MultiSelect
              options={permissionOptions}
              value={videoData.permissions}
              onChange={(v) => onVideoInputChange('permissions', v)}
              placeholder="Selecione as permissões"
              brandClass="text-brand-videos"
              brandBgClass="bg-brand-videos/10"
              ringClass="focus:ring-brand-videos/30 focus:border-brand-videos"
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Thumbnail">
              <FileField accept="image/*" fileName={newThumbnail?.name} onChange={setNewThumbnail} brandClass="text-brand-videos" />
            </Field>
            <Field label="Arquivo do vídeo">
              <FileField accept="video/*" fileName={newFile?.name} onChange={setNewFile} brandClass="text-brand-videos" />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Category view / edit modal */}
      <Modal
        open={!!targetCategory}
        onClose={() => setTargetCategory(null)}
        title={targetCategory?.display_name ?? 'Categoria'}
        footer={
          <>
            <CancelButton onClick={() => setTargetCategory(null)} />
            <SubmitButton onClick={handleUpdateCategory} disabled={!targetCategory?.display_name?.trim()} brandClass="bg-brand-videos">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetCategory && (
          <div className="space-y-5">
            <Field label="Escopo da categoria">
              <TextField value={targetCategory.scope ? scopeLabelMapper[targetCategory.scope] : 'Formação'} readOnly />
            </Field>
            <Field label="Nome" required>
              <TextField
                value={targetCategory.display_name}
                onChange={(v) => setTargetCategory((e) => (e ? { ...e, display_name: v } : e))}
              />
            </Field>
            <div className="pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemoveCategoryOpen(true)}>
                <Trash2 className="size-4" /> Excluir categoria
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeCategoryOpen}
        onClose={() => setRemoveCategoryOpen(false)}
        onConfirm={handleRemoveCategory}
        title={`Remover ${targetCategory?.display_name ?? 'categoria'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* Category create modal */}
      <Modal
        open={createCategoryOpen}
        onClose={() => {
          resetCategoryCreateForm();
          setCreateCategoryOpen(false);
        }}
        title="Registrar categoria"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetCategoryCreateForm();
                setCreateCategoryOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitCategory(handleRegisterCategory)}
              disabled={!categoryData.display_name?.trim()}
              brandClass="bg-brand-videos"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Escopo da categoria" error={categoryErrors.scope}>
            <RadioGroup
              value={(categoryData.scope as HubContentScope | '') ?? ''}
              onChange={(v) => onCategoryInputChange('scope', (v || null) as any)}
              options={SCOPE_OPTIONS}
              brandClass="text-brand-videos border-brand-videos"
            />
          </Field>
          <Field label="Nome" required error={categoryErrors.display_name}>
            <TextField
              value={categoryData.display_name}
              onChange={(v) => onCategoryInputChange('display_name', v)}
              placeholder="Ex: Programação"
              error={categoryErrors.display_name}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

export default Videos;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'videos';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Vídeos' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
