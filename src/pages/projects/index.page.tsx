import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import moment from 'moment';

import { cookieManager, formatClassGrade, formatReadableId, logError, sortGrades } from '@/_base/utils';
import { useAsyncCallback, useInputHandler } from '@/_base/hooks';
import { getBnccSkills, getProfile } from '@/_base/services/user';
import { getAvailableGrades } from '@/_base/services/admin';
import { listVideos } from '@/_base/services/video';
import { listPermissions } from '@/_base/services/permissions';
import { listBooks } from '@/_base/services/book';
import { createProject, getFactoryProjects, removeProject, updateProject } from '@/_base/services/project';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { EMPTY_PROJECT_DATA, hubProjectSchema, IHubProject, IHubProjectStep, IRegisterProjectParams, IUpdateProjectParams } from '@/_base/interfaces/project';
import { IHubVideo } from '@/_base/interfaces/video';
import { IHubBook } from '@/_base/interfaces/book';
import { IHubPermission } from '@/_base/interfaces/permission';
import { IBnccSkill } from '@/_base/interfaces/shared';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, PrimaryButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, TextField, TextAreaField, SelectField, MultiSelect, TagsField, FileField, ColorSwatchPicker } from '@/components/ui/form-controls';
import { CancelButton, SubmitButton, GhostButton } from '@/components/ui/form-buttons';

interface IProps {
  user: IHubUser;
}

const BRAND_CLASS = 'text-brand-projetos';
const BRAND_BG_CLASS = 'bg-brand-projetos/10';
const RING_CLASS = 'focus:ring-brand-projetos/30 focus:border-brand-projetos';

const STEP_COLORS = ['#f8bb3c', '#5671b6', '#1a1740', '#3e7aff', '#20f480', '#ff515c'];

const GENERIC_TOOLS = [
  'Tesoura',
  'Agulha',
  'Fita adesiva',
  'Caixas de papelão',
  'Cola quente',
  'Madeira',
  'Garrafas de plástico',
  'Palitos de picolé',
  'Metal',
  'Papel',
  'Cartão',
  'Tinta',
  'Pincéis',
  'Lâmpadas LED',
  'Resistores',
  'Capacitores',
  'Baterias',
  'Fios',
  'Conectores',
  'Placa de circuito impresso',
];

async function uploadAndGetPath(file: File): Promise<string> {
  const { link, path } = await getPresignedUrl(file.type, 'picode_project');
  await uploadFile(link, file);
  return path;
}

type ProjectRow = {
  id: string;
  code: string;
  title: string;
  grades_display: string;
  created_at: string;
};

const formatProjectRow = (project: IHubProject): ProjectRow => ({
  id: project.id,
  code: formatReadableId(project.readable_id),
  title: project.title,
  grades_display: project.grades?.map(formatClassGrade).join(' · ') || '-',
  created_at: moment(project.created_at).format('DD/MM/YYYY'),
});

const Projects: React.FC<IProps> = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [projects, setProjects] = useState<IHubProject[]>([]);
  const [videos, setVideos] = useState<IHubVideo[]>([]);
  const [books, setBooks] = useState<IHubBook[]>([]);
  const [bnccSkills, setBnccSkills] = useState<IBnccSkill[]>([]);
  const [permissions, setPermissions] = useState<IHubPermission[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  const [projectRows, setProjectRows] = useState<ProjectRow[]>([]);
  const [projectSearch, setProjectSearch] = useState('');

  const toast = useToast();

  const [targetProject, setTargetProject] = useState<IHubProject | null>(null);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [removeProjectOpen, setRemoveProjectOpen] = useState(false);

  // Shared "etapas do projeto" UI state, reused across the view/edit and create modals (only one is open at a time).
  const [stepGroups, setStepGroups] = useState<string[]>([]);
  const [stepGroupColors, setStepGroupColors] = useState<Record<string, string>>({});
  const [stepGroupError, setStepGroupError] = useState('');

  const {
    data: projectData,
    errors: projectErrors,
    setErrors: setProjectErrors,
    onInputChange: onProjectInputChange,
    submit: submitProject,
    setData: setProjectData,
  } = useInputHandler({ data: EMPTY_PROJECT_DATA, schema: hubProjectSchema });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ results: projectRes }, { results: bookRes }, { results: videoRes }, grades, { results: permissionRes }, bnccRes] = await Promise.all([
        getFactoryProjects(),
        listBooks(),
        listVideos(),
        getAvailableGrades(),
        listPermissions(),
        getBnccSkills(),
      ]);
      setProjects(projectRes);
      setBooks(bookRes);
      setVideos(videoRes);
      setPermissions(permissionRes);
      setBnccSkills(bnccRes);
      setAvailableGrades(sortGrades(grades));
    } catch {
      toast({ status: `error`, description: `Ocorreu um erro` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => setProjectRows(projects.map(formatProjectRow)), [projects]);

  const resetCreateForm = () => {
    setProjectData(EMPTY_PROJECT_DATA);
    setProjectErrors({} as any);
    setNewThumbnail(null);
    setStepGroups([]);
    setStepGroupColors({});
    setStepGroupError('');
  };

  const handleOpenProjectModal = (id: string) => {
    const project = projects.find((e) => e.id === id);
    if (!project) return;

    const targetStepGroups = project.metadata?.steps?.reduce((acc, r) => (acc.includes(r.parent) ? acc : [...acc, r.parent]), [] as string[]) || [];
    if (!targetStepGroups.filter((e) => e).length) project.metadata.steps = [];

    setStepGroups(targetStepGroups);
    setStepGroupColors(
      project.metadata.steps?.reduce(
        (acc, v) => {
          acc[v.parent] = v.color;
          return acc;
        },
        {} as Record<string, string>,
      ) || {},
    );
    setStepGroupError('');
    setTargetProject(project);
    setNewThumbnail(null);
  };

  const handleAddStepGroup = () => {
    if (stepGroups.length && !stepGroups.find((e) => !!e)?.length) setStepGroupError('Preencha o campo');
    else {
      setStepGroupError('');
      setStepGroups((s) => [...s, '']);
    }
  };

  const handleChangeStep = (isEdit: boolean, index: number, obj: Partial<IHubProjectStep>) => {
    if (isEdit) {
      setTargetProject((c) => {
        if (!c?.metadata.steps?.[index]) return c;
        const steps = [...c.metadata.steps];
        steps[index] = { ...steps[index], ...obj };
        return { ...c, metadata: { ...c.metadata, steps } };
      });
    } else {
      const steps = projectData.metadata?.steps ? [...projectData.metadata.steps] : [];
      if (!steps[index]) return;
      steps[index] = { ...steps[index], ...obj };
      onProjectInputChange('metadata', { ...projectData.metadata, steps });
    }
  };

  const handleRemoveStep = (isEdit: boolean, index: number) => {
    if (isEdit) {
      setTargetProject((c) => {
        if (!c?.metadata.steps?.[index]) return c;
        const steps = c.metadata.steps.filter((_, i) => i !== index);
        return { ...c, metadata: { ...c.metadata, steps } };
      });
    } else {
      const steps = (projectData.metadata?.steps || []).filter((_, i) => i !== index);
      onProjectInputChange('metadata', { ...projectData.metadata, steps });
    }
  };

  const handleAddStep = (isEdit: boolean, parent: string) => {
    const newStep: IHubProjectStep = { title: '', parent, description: '', position: 0, cashback: '', color: stepGroupColors[parent] };
    if (isEdit) {
      setTargetProject((c) => {
        if (!c) return c;
        const steps = [...(c.metadata.steps || [])];
        newStep.position = steps.length + 1;
        return { ...c, metadata: { ...c.metadata, steps: [...steps, newStep] } };
      });
    } else {
      const steps = [...(projectData.metadata?.steps || [])];
      newStep.position = steps.length + 1;
      onProjectInputChange('metadata', { ...projectData.metadata, steps: [...steps, newStep] });
    }
  };

  const handleUpdateProject = useAsyncCallback(
    async () => {
      if (!targetProject) return;
      setIsLoading(true);

      const steps = targetProject.metadata.steps?.map((s) => ({ ...s, color: stepGroupColors[s.parent] }));

      const dto: IUpdateProjectParams = {
        id: targetProject.id,
        title: targetProject.title,
        description: targetProject.description || undefined,
        permissions: targetProject.content_permission_links?.map((link) => link.permission.id),
        metadata: { ...targetProject.metadata, steps },
      };

      if (newThumbnail) dto.metadata!.thumbnail = await uploadAndGetPath(newThumbnail);

      const updatedProject = await updateProject(dto);

      setProjects((s) => s.map((e) => (e.id === updatedProject.id ? { ...targetProject, ...updatedProject } : e)));
      setTargetProject(null);
      setNewThumbnail(null);

      toast({ description: 'Projeto atualizado!', status: 'success' });
    },
    [targetProject, newThumbnail, stepGroupColors],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterProject = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const steps = projectData.metadata?.steps?.map((s) => ({ ...s, color: stepGroupColors[s.parent] }));
      const payload: IRegisterProjectParams = { ...projectData, metadata: { ...projectData.metadata, steps } };

      if (newThumbnail) payload.metadata.thumbnail = await uploadAndGetPath(newThumbnail);

      const newProject = await createProject(payload);

      setProjects((s) => [newProject, ...s]);
      resetCreateForm();
      setCreateProjectOpen(false);

      toast({ description: 'Projeto criado!', status: 'success' });
    },
    [projectData, newThumbnail, stepGroupColors],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveProject = useAsyncCallback(
    async () => {
      if (!targetProject) return;
      setIsLoading(true);

      await removeProject(targetProject.id);

      setProjects((s) => s.filter((e) => e.id !== targetProject.id));
      setTargetProject(null);
      setRemoveProjectOpen(false);
      toast({ description: 'Projeto removido!', status: 'success' });
    },
    [targetProject],
    false,
    () => setIsLoading(false),
  );

  const filteredProjects = projectRows.filter((row) => {
    if (!projectSearch.trim()) return true;
    const q = projectSearch.trim().toLowerCase();
    return row.code.toLowerCase().includes(q) || row.title?.toLowerCase().includes(q);
  });

  const permissionOptions = permissions.map((p) => ({ value: p.id, label: p.title }));
  const gradeOptions = availableGrades.map((g) => ({ value: g, label: formatClassGrade(g) }));
  const bookOptions = books.map((b) => ({ value: b.id, label: b.title }));
  const bnccOptions = bnccSkills.map((s) => ({ value: s.tag, label: `${s.tag} - ${s.title}` }));

  const projectColumns: Column<ProjectRow>[] = [
    {
      key: 'projeto',
      header: 'Projeto',
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-zinc-900">{r.title}</span>
          <span className="text-[11px] text-zinc-400">Código {r.code}</span>
        </div>
      ),
    },
    { key: 'anos', header: 'Anos', render: (r) => <span className="text-zinc-600">{r.grades_display}</span> },
    { key: 'criado', header: 'Criado em', render: (r) => <span className="text-zinc-500">{r.created_at}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenProjectModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  const renderStepsPanel = (isEdit: boolean) => {
    const steps = (isEdit ? targetProject?.metadata.steps : projectData.metadata?.steps) || [];
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Etapas do projeto</p>
          <button
            type="button"
            onClick={handleAddStepGroup}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-input bg-background hover:bg-muted transition"
          >
            <Plus className="size-3.5" /> Adicionar etapa
          </button>
        </div>

        {stepGroups.map((parent, idx) => (
          <div key={idx} className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center gap-2">
              <input
                value={parent}
                onChange={(e) =>
                  setStepGroups((arr) => arr.map((p, i) => (i === idx ? e.target.value : p)))
                }
                placeholder="Ex: Planejamento"
                className={`flex-1 px-2.5 py-1.5 text-sm rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 transition ${
                  !parent && stepGroupError ? 'border-destructive focus:ring-destructive/30' : `border-input ${RING_CLASS}`
                }`}
              />
              <ColorSwatchPicker
                colors={STEP_COLORS}
                value={stepGroupColors[parent]}
                onChange={(color) => setStepGroupColors((c) => ({ ...c, [parent]: color }))}
              />
            </div>
            {!parent && stepGroupError && <p className="text-[11px] text-destructive">{stepGroupError}</p>}

            <button
              type="button"
              onClick={() => handleAddStep(isEdit, parent)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-input bg-background hover:bg-muted transition"
            >
              {parent ? `Adicionar atividades em ${parent}` : 'Adicionar atividades'} <Plus className="size-3" />
            </button>

            {steps.map((step, i) =>
              step.parent !== parent ? null : (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-[3] space-y-1">
                    <label className="text-[11px] text-muted-foreground">Atividade</label>
                    <input
                      value={step.title}
                      onChange={(e) => handleChangeStep(isEdit, i, { title: e.target.value })}
                      className={`w-full px-2 py-1 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] text-muted-foreground">Cashback</label>
                    <input
                      value={step.cashback}
                      onChange={(e) => handleChangeStep(isEdit, i, { cashback: e.target.value.match(/\d+/g)?.join('') || '' })}
                      className={`w-full px-2 py-1 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
                    />
                  </div>
                  <button type="button" onClick={() => handleRemoveStep(isEdit, i)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition">
                    <X className="size-4" />
                  </button>
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="font-sans">
      <PageHeader
        title="Projetos"
        description="Gerencie os projetos maker disponíveis na plataforma."
        actions={
          <PrimaryButton onClick={() => setCreateProjectOpen(true)}>
            <Plus className="size-4" /> Novo Projeto
          </PrimaryButton>
        }
      />

      <div className="mb-4 max-w-xs relative">
        <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
          placeholder="Buscar por código ou título"
          className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
        />
      </div>
      <DataTable columns={projectColumns} data={filteredProjects} empty={isLoading ? 'Carregando...' : 'Nenhum projeto cadastrado.'} />

      {/* ------------------- Project view / edit modal ------------------- */}
      <Modal
        open={!!targetProject}
        onClose={() => setTargetProject(null)}
        title={targetProject?.title ?? 'Projeto'}
        width="max-w-4xl"
        footer={
          <>
            <CancelButton onClick={() => setTargetProject(null)} />
            <SubmitButton onClick={handleUpdateProject} disabled={!targetProject?.title?.trim()} brandClass="bg-brand-projetos">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetProject && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-5">
              <Field label="Título" required>
                <TextField value={targetProject.title} onChange={(v) => setTargetProject((e) => (e ? { ...e, title: v } : e))} />
              </Field>
              <Field label="Objetivo">
                <TextAreaField
                  value={targetProject.description ?? ''}
                  onChange={(v) => setTargetProject((e) => (e ? { ...e, description: v } : e))}
                  placeholder="Descrição opcional"
                />
              </Field>
              <Field label="Anos">
                <TextField value={targetProject.grades?.map(formatClassGrade).join(', ') || '-'} readOnly />
              </Field>
              <Field label="Habilidades BNCC">
                <MultiSelect
                  options={bnccOptions}
                  value={targetProject.metadata?.bncc ?? []}
                  onChange={(bncc) => setTargetProject((p) => (p ? { ...p, metadata: { ...p.metadata, bncc } } : p))}
                  placeholder="Selecione as habilidades BNCC"
                  brandClass={BRAND_CLASS}
                  brandBgClass={BRAND_BG_CLASS}
                  ringClass={RING_CLASS}
                />
              </Field>
              <Field label="Ferramentas">
                <TagsField
                  value={targetProject.metadata?.tools ?? []}
                  onChange={(tools) => setTargetProject((p) => (p ? { ...p, metadata: { ...p.metadata, tools } } : p))}
                  suggestions={GENERIC_TOOLS}
                  brandClass={BRAND_CLASS}
                  brandBgClass={BRAND_BG_CLASS}
                  ringClass={RING_CLASS}
                />
              </Field>
              <Field label="Permissões">
                <MultiSelect
                  options={permissionOptions}
                  value={targetProject.content_permission_links?.map((l) => l.permission.id) ?? []}
                  onChange={(ids) =>
                    setTargetProject((e) =>
                      e ? { ...e, content_permission_links: ids.map((id) => ({ id, permission: permissions.find((p) => p.id === id) }) as any) } : e,
                    )
                  }
                  placeholder="Selecione as permissões"
                  brandClass={BRAND_CLASS}
                  brandBgClass={BRAND_BG_CLASS}
                  ringClass={RING_CLASS}
                />
              </Field>
              <Field label="Livro">
                <TextField value={books.find((b) => b.id === targetProject.book_id)?.title || '-'} readOnly />
              </Field>
              <Field label="Thumbnail">
                <div className="space-y-2">
                  {targetProject.metadata?.thumbnail && (
                    <img src={targetProject.metadata.thumbnail} alt="Thumbnail atual" className="h-24 rounded-lg ring-1 ring-border object-cover" />
                  )}
                  <FileField accept="image/*" fileName={newThumbnail?.name} onChange={setNewThumbnail} brandClass={BRAND_CLASS} />
                </div>
              </Field>
            </div>

            <div>{renderStepsPanel(true)}</div>

            <div className="sm:col-span-2 pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemoveProjectOpen(true)}>
                <Trash2 className="size-4" /> Excluir projeto
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeProjectOpen}
        onClose={() => setRemoveProjectOpen(false)}
        onConfirm={handleRemoveProject}
        title={`Remover ${targetProject?.title ?? 'projeto'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* ------------------- Project create modal ------------------- */}
      <Modal
        open={createProjectOpen}
        onClose={() => {
          resetCreateForm();
          setCreateProjectOpen(false);
        }}
        title="Registrar projeto"
        width="max-w-4xl"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetCreateForm();
                setCreateProjectOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitProject(handleRegisterProject)}
              disabled={!projectData.title?.trim() || !projectData.grades?.length}
              brandClass="bg-brand-projetos"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-5">
            <Field label="Título" required error={projectErrors.title}>
              <TextField
                value={projectData.title}
                onChange={(v) => onProjectInputChange('title', v)}
                placeholder="Ex: Robô seguidor de linha"
                error={projectErrors.title}
              />
            </Field>
            <Field label="Objetivo" error={projectErrors.description}>
              <TextAreaField
                value={projectData.description ?? ''}
                onChange={(v) => onProjectInputChange('description', v)}
                placeholder="Descrição opcional"
              />
            </Field>
            <Field label="Anos" required error={projectErrors.grades as any}>
              <MultiSelect
                options={gradeOptions}
                value={projectData.grades}
                onChange={(v) => onProjectInputChange('grades', v)}
                placeholder="Selecione os anos"
                brandClass={BRAND_CLASS}
                brandBgClass={BRAND_BG_CLASS}
                ringClass={RING_CLASS}
              />
            </Field>
            <Field label="Habilidades BNCC">
              <MultiSelect
                options={bnccOptions}
                value={projectData.metadata?.bncc}
                onChange={(bncc) => onProjectInputChange('metadata', { ...projectData.metadata, bncc })}
                placeholder="Selecione as habilidades BNCC"
                brandClass={BRAND_CLASS}
                brandBgClass={BRAND_BG_CLASS}
                ringClass={RING_CLASS}
              />
            </Field>
            <Field label="Ferramentas">
              <TagsField
                value={projectData.metadata?.tools}
                onChange={(tools) => onProjectInputChange('metadata', { ...projectData.metadata, tools })}
                suggestions={GENERIC_TOOLS}
                brandClass={BRAND_CLASS}
                brandBgClass={BRAND_BG_CLASS}
                ringClass={RING_CLASS}
              />
            </Field>
            <Field label="Permissões">
              <MultiSelect
                options={permissionOptions}
                value={projectData.permissions}
                onChange={(v) => onProjectInputChange('permissions', v)}
                placeholder="Selecione as permissões"
                brandClass={BRAND_CLASS}
                brandBgClass={BRAND_BG_CLASS}
                ringClass={RING_CLASS}
              />
            </Field>
            <Field label="Livro" error={projectErrors.book_id}>
              <SelectField
                value={projectData.book_id}
                onChange={(v) => onProjectInputChange('book_id', v)}
                options={bookOptions}
                placeholder="Selecione o livro do projeto"
                error={projectErrors.book_id}
              />
            </Field>
            <Field label="Thumbnail">
              <FileField accept="image/*" fileName={newThumbnail?.name} onChange={setNewThumbnail} brandClass={BRAND_CLASS} />
            </Field>
          </div>

          <div>{renderStepsPanel(false)}</div>
        </div>
      </Modal>
    </div>
  );
};

export default Projects;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'projects';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Projetos' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
