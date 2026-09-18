import { GetServerSideProps } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { KeyRound, Plus, RotateCcw, School, Search, Trash2, X } from 'lucide-react';

import { cookieManager, formatClassGrade, logError, sortGrades } from '@/_base/utils';
import { useAsyncCallback, useInputHandler } from '@/_base/hooks';
import { getProfile } from '@/_base/services/user';
import { createSchool, listSchools, removeSchool, resetSchoolPassword, updateSchool } from '@/_base/services/school';
import { EMPTY_SCHOOL_DATA, registerSchoolSchema } from '@/_base/interfaces/school/IRegisterSchoolParams';
import { IHubSchool } from '@/_base/interfaces/school';
import { listSchoolGroups } from '@/_base/services/schoolGroup';
import { IHubSchoolGroup } from '@/_base/interfaces/schoolGroup';
import { ISimpleHubClass } from '@/_base/interfaces/class';
import { getAvailableGrades } from '@/_base/services/admin';
import { resetProjectsFromSchool } from '@/_base/services/project';
import { IRedefinePassword } from '@/_base/interfaces/shared/IRedefinePassword';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, PrimaryButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, TextField, SelectField, RadioGroup } from '@/components/ui/form-controls';
import { CancelButton, SubmitButton, GhostButton } from '@/components/ui/form-buttons';

interface IProps {
  user: IHubUser;
}

type DataType = {
  id: string;
  code: string;
  school_name: string;
  school_group_name: string;
  class_quantity: string;
};

const formatTableData = (school: IHubSchool): DataType => ({
  id: school.id,
  code: school.code || '-',
  class_quantity: `${school.classes?.length ?? 0}`,
  school_group_name: school.school_group?.display_name || '-',
  school_name: school.display_name || '-',
});

const FORCE_REDEFINE_OPTIONS = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' },
];

const Schools: React.FC<IProps> = () => {
  const [targetSchool, setTargetSchool] = useState<IHubSchool | null>(null);
  const [schools, setSchools] = useState<IHubSchool[]>([]);
  const [schoolGroups, setSchoolGroups] = useState<IHubSchoolGroup[]>([]);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [classes, setClasses] = useState<ISimpleHubClass[]>([]);
  const [newClass, setNewClass] = useState<Partial<ISimpleHubClass>>({});

  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordConfig, setResetPasswordConfig] = useState<IRedefinePassword>({ password: '', force_redefine: false });
  const [resetProjectsOpen, setResetProjectsOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const toast = useToast();
  const { data, errors, setErrors, onInputChange, submit, setData } = useInputHandler({
    data: EMPTY_SCHOOL_DATA,
    schema: registerSchoolSchema,
  });

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [{ results: schoolRes }, { results: groupRes }, grades] = await Promise.all([listSchools(), listSchoolGroups(), getAvailableGrades()]);
        setSchoolGroups(groupRes);
        setSchools(schoolRes);
        setAvailableGrades(sortGrades(grades));
      } catch {
        toast({ status: `error`, description: `Ocorreu um erro` });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setTableData(schools.map(formatTableData));
  }, [schools]);

  const resetCreateForm = () => {
    setData(EMPTY_SCHOOL_DATA);
    setErrors({} as any);
    setClasses([]);
    setNewClass({});
  };

  const handleOpenSchoolModal = (code: string) => {
    const school = schools.find((e) => e.code === code);
    if (school) setTargetSchool(school);
  };

  const handleUpdateSchool = useAsyncCallback(
    async () => {
      if (!targetSchool) return;
      setIsLoading(true);

      const updatedSchool = await updateSchool({
        id: targetSchool.id,
        display_name: targetSchool.display_name,
        description: targetSchool.description,
      });

      setSchools((s) => s.map((e) => (e.id === updatedSchool.id ? { ...targetSchool, ...updatedSchool } : e)));
      setTargetSchool(null);

      toast({ description: 'Escola atualizada!', status: 'success' });
    },
    [targetSchool],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterSchool = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const newSchool = await createSchool({ ...data, classes: classes.length ? classes : undefined });

      setSchools((s) => [newSchool, ...s]);
      resetCreateForm();
      setCreateOpen(false);
    },
    [data, classes],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveSchool = useAsyncCallback(
    async () => {
      if (!targetSchool) return;
      setIsLoading(true);

      await removeSchool(targetSchool.id);

      setSchools((s) => s.filter((e) => e.id !== targetSchool.id));
      setTargetSchool(null);
      setRemoveOpen(false);
      toast({ status: `success`, description: `Escola removida com sucesso` });
    },
    [targetSchool],
    false,
    () => setIsLoading(false),
  );

  const handleResetStudentPassword = useAsyncCallback(
    async () => {
      if (!targetSchool) return;
      setIsLoading(true);

      await resetSchoolPassword(targetSchool.id, resetPasswordConfig);

      setResetPasswordOpen(false);
      setResetPasswordConfig({ password: '', force_redefine: false });
      toast({ status: `success`, title: `Senha dos alunos resetada com sucesso`, position: `top-right` });
    },
    [targetSchool, resetPasswordConfig],
    false,
    () => setIsLoading(false),
  );

  const handleResetProjects = useAsyncCallback(
    async () => {
      if (!targetSchool) return;
      setIsLoading(true);

      await resetProjectsFromSchool(targetSchool.id);

      setResetProjectsOpen(false);
      toast({ status: `success`, title: `Projetos de fábrica resetados com sucesso`, position: `top-right` });
    },
    [targetSchool],
    false,
    () => setIsLoading(false),
  );

  const handleAddClass = useCallback(() => {
    if (!newClass.name || !newClass.grade) {
      toast({ status: `error`, title: `Preencha o ano e nome da turma` });
      return;
    }
    if (!availableGrades.includes(newClass.grade)) {
      toast({ status: `error`, title: `Insira um ano válido: ${availableGrades.slice(0, -1).join(`, `)} e ${availableGrades.at(-1)}` });
      return;
    }
    setClasses((c) => [...c, newClass as ISimpleHubClass]);
    setNewClass({});
  }, [newClass, availableGrades, toast]);

  const filteredData = tableData.filter((row) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      row.code?.toLowerCase().includes(q) ||
      row.school_name?.toLowerCase().includes(q) ||
      row.school_group_name?.toLowerCase().includes(q)
    );
  });

  const columns: Column<DataType>[] = [
    {
      key: 'nome',
      header: 'Escola',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-brand-escolas/10 grid place-items-center">
            <School className="size-4 text-brand-escolas" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">{r.school_name}</span>
            <span className="text-[11px] text-zinc-400">{r.school_group_name}</span>
          </div>
        </div>
      ),
    },
    { key: 'turmas', header: 'Turmas', render: (r) => <span className="text-zinc-700 tabular-nums">{r.class_quantity}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenSchoolModal(r.code)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="font-sans">
      <PageHeader
        title="Escolas"
        description="Todas as escolas vinculadas às redes educacionais."
        actions={
          <PrimaryButton onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Nova Escola
          </PrimaryButton>
        }
      />

      <div className="mb-4 max-w-xs relative">
        <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, escola ou rede"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-escolas/30 focus:border-brand-escolas transition"
        />
      </div>

      <DataTable columns={columns} data={filteredData} empty={isLoading ? 'Carregando...' : 'Nenhuma escola cadastrada.'} />

      {/* View / Edit modal */}
      <Modal
        open={!!targetSchool}
        onClose={() => setTargetSchool(null)}
        title={targetSchool?.display_name ?? 'Escola'}
        width="max-w-2xl"
        footer={
          <>
            <CancelButton onClick={() => setTargetSchool(null)} />
            <SubmitButton onClick={handleUpdateSchool} disabled={!targetSchool?.display_name?.trim()} brandClass="bg-brand-escolas">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetSchool && (
          <div className="space-y-5">
            <Field label="Rede">
              <TextField value={targetSchool.school_group?.display_name ?? '-'} readOnly />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome" required>
                <TextField value={targetSchool.display_name} onChange={(v) => setTargetSchool((e) => (e ? { ...e, display_name: v } : e))} />
              </Field>
              <Field label="Código de acesso">
                <TextField value={targetSchool.code} readOnly />
              </Field>
            </div>
            <Field label="Descrição">
              <TextField
                value={targetSchool.description ?? ''}
                onChange={(v) => setTargetSchool((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <GhostButton onClick={() => setResetPasswordOpen(true)}>
                <KeyRound className="size-4" /> Resetar senhas
              </GhostButton>
              <GhostButton onClick={() => setResetProjectsOpen(true)}>
                <RotateCcw className="size-4" /> Resetar projetos
              </GhostButton>
              <GhostButton tone="danger" onClick={() => setRemoveOpen(true)}>
                <Trash2 className="size-4" /> Excluir escola
              </GhostButton>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Turmas desta escola</h3>
              <div className="rounded-xl ring-1 ring-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Turma</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-32">Código</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {targetSchool.classes.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                          Nenhuma turma vinculada a esta escola.
                        </td>
                      </tr>
                    ) : (
                      targetSchool.classes.map((hubClass) => (
                        <tr key={hubClass.id} className="hover:bg-muted/60">
                          <td className="px-4 py-2.5 text-foreground">{hubClass.display_name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{hubClass.code}</td>
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

      {/* Reset student passwords */}
      <Modal
        open={resetPasswordOpen}
        onClose={() => setResetPasswordOpen(false)}
        title={`Resetar senha dos alunos`}
        width="max-w-md"
        footer={
          <>
            <CancelButton onClick={() => setResetPasswordOpen(false)} />
            <SubmitButton onClick={handleResetStudentPassword} disabled={!resetPasswordConfig.password} brandClass="bg-brand-escolas">
              Confirmar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para continuar, defina uma nova senha para todos os alunos da escola {targetSchool?.display_name} e a obrigatoriedade de redefinição.
          </p>
          <Field label="Nova senha" required error={!resetPasswordConfig.password ? 'Campo obrigatório' : undefined}>
            <TextField
              value={resetPasswordConfig.password}
              onChange={(v) => setResetPasswordConfig((c) => ({ ...c, password: v }))}
            />
          </Field>
          <Field label="Obrigar o aluno a redefinir a senha no próximo login?">
            <RadioGroup
              value={resetPasswordConfig.force_redefine ? 'true' : 'false'}
              onChange={(v) => setResetPasswordConfig((c) => ({ ...c, force_redefine: v === 'true' }))}
              options={FORCE_REDEFINE_OPTIONS}
              brandClass="text-brand-escolas border-brand-escolas"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={resetProjectsOpen}
        onClose={() => setResetProjectsOpen(false)}
        onConfirm={handleResetProjects}
        title="Resetar projetos de fábrica"
        description={`Resetar todos os projetos de fábrica na escola ${targetSchool?.display_name}? Essa ação é irreversível.`}
        confirmLabel="Resetar"
        tone="neutral"
      />
      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={handleRemoveSchool}
        title={`Remover ${targetSchool?.display_name ?? 'escola'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          resetCreateForm();
          setCreateOpen(false);
        }}
        title="Registrar escola"
        width="max-w-2xl"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetCreateForm();
                setCreateOpen(false);
              }}
            />
            <SubmitButton onClick={() => submit(handleRegisterSchool)} disabled={!data.display_name?.trim() || !data.hub_school_group_id} brandClass="bg-brand-escolas">
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Rede" required>
            <SelectField
              value={data.hub_school_group_id ?? ''}
              onChange={(v) => onInputChange('hub_school_group_id', v)}
              options={schoolGroups.map((g) => ({ value: g.id, label: g.display_name }))}
              placeholder="Selecione a rede"
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome" required error={errors.display_name}>
              <TextField
                value={data.display_name ?? ''}
                onChange={(v) => onInputChange('display_name', v)}
                placeholder="Ex: Colégio Alpha"
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
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Adicionar turma</span>
              <button
                type="button"
                onClick={handleAddClass}
                className="p-1.5 rounded-md text-brand-escolas hover:bg-brand-escolas/10 transition"
                aria-label="Adicionar turma"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <TextField value={newClass.name ?? ''} onChange={(v) => setNewClass((c) => ({ ...c, name: v }))} placeholder="Nome da turma" />
              <TextField value={newClass.grade ?? ''} onChange={(v) => setNewClass((c) => ({ ...c, grade: v }))} placeholder="Ano (ex: 5, 9, 1em)" />
            </div>
            {classes.length > 0 && (
              <div className="rounded-lg ring-1 ring-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Turma</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Ano</th>
                      <th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classes.map((c, i) => (
                      <tr key={`${c.name}-${i}`}>
                        <td className="px-3 py-2 text-foreground">{c.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatClassGrade(c.grade)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setClasses((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-muted-foreground hover:text-destructive transition"
                            aria-label="Remover turma"
                          >
                            <X className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {classes.length} {classes.length === 1 ? 'turma adicionada' : 'turmas adicionadas'}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Schools;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'schools';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return {
      props: { admin, selectedPage, pageTitle: 'Escolas' },
    };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
