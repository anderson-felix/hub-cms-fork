import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { GraduationCap, KeyRound, Plus, RotateCcw, Search, ShieldOff, Trash2 } from 'lucide-react';

import { cookieManager, formatClassGrade, logError, sortGrades } from '@/_base/utils';
import { useAsyncCallback, useInputHandler } from '@/_base/hooks';
import { getProfile } from '@/_base/services/user';
import { createClass, listClasses, removeClass, resetClassPassword, restrictClassAccess, updateClass } from '@/_base/services/class';
import { IHubClass, IRegisterHubClassParams, registerClassSchema } from '@/_base/interfaces/class';
import { listSchools } from '@/_base/services/school';
import { IHubSchool } from '@/_base/interfaces/school';
import { getAvailableGrades } from '@/_base/services/admin';
import { resetProjectsFromClass } from '@/_base/services/project';
import { IRedefinePassword } from '@/_base/interfaces/shared/IRedefinePassword';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, PrimaryButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CopyButton, Field, TextField, SelectField, RadioGroup } from '@/components/ui/form-controls';
import { AccessControlModal } from '@/components/ui/access-control-modal';
import { CancelButton, SubmitButton, GhostButton } from '@/components/ui/form-buttons';

interface IProps {
  user: IHubUser;
}

const EMPTY_CLASS_DATA: IRegisterHubClassParams = {
  hub_school_id: '',
  display_name: '',
  description: '',
  grade: '',
};

type DataType = {
  id: string;
  code: string;
  class_name: string;
  school_name: string;
  grade: string;
  student_quantity: string;
};

const formatTableData = (hubClass: IHubClass): DataType => ({
  id: hubClass.id,
  code: hubClass.code || '-',
  class_name: hubClass.display_name || '-',
  school_name: hubClass.hub_school?.display_name || '-',
  grade: hubClass.grade || '-',
  student_quantity: `${hubClass.students?.length ?? 0}`,
});

const FORCE_REDEFINE_OPTIONS = [
  { value: 'true', label: 'Sim' },
  { value: 'false', label: 'Não' },
];

const Classes: React.FC<IProps> = () => {
  const [targetClass, setTargetClass] = useState<IHubClass | null>(null);
  const [classes, setClasses] = useState<IHubClass[]>([]);
  const [schools, setSchools] = useState<IHubSchool[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordConfig, setResetPasswordConfig] = useState<IRedefinePassword>({ password: '', force_redefine: false });
  const [resetProjectsOpen, setResetProjectsOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [restrictModalOpen, setRestrictModalOpen] = useState(false);

  const toast = useToast();
  const { data, errors, setErrors, onInputChange, submit, setData } = useInputHandler({
    data: EMPTY_CLASS_DATA,
    schema: registerClassSchema,
  });

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [{ results: classRes }, { results: schoolRes }, grades] = await Promise.all([listClasses(), listSchools(), getAvailableGrades()]);
        setSchools(schoolRes);
        setClasses(classRes);
        setAvailableGrades(sortGrades(grades));
      } catch {
        toast({ status: `error`, description: `Ocorreu um erro` });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setTableData(classes.map(formatTableData));
  }, [classes]);

  const resetCreateForm = () => {
    setData(EMPTY_CLASS_DATA);
    setErrors({} as any);
  };

  const handleOpenClassModal = (code: string) => {
    const hubClass = classes.find((e) => e.code === code);
    if (hubClass) setTargetClass(hubClass);
  };

  const handleUpdateClass = useAsyncCallback(
    async () => {
      if (!targetClass) return;
      setIsLoading(true);

      const updatedClass = await updateClass({
        id: targetClass.id,
        display_name: targetClass.display_name,
        description: targetClass.description,
      });

      setClasses((s) => s.map((e) => (e.id === updatedClass.id ? { ...targetClass, ...updatedClass } : e)));
      setTargetClass(null);

      toast({ description: 'Turma atualizada!', status: 'success' });
    },
    [targetClass],
    false,
    () => setIsLoading(false),
  );

  // Access is enforced per user on the backend (`disabled_at`), so there is no readable status on the
  // class itself: this is a fire-and-forget action (enable / restrict), applied instantly.
  const handleRestrictAccess = useAsyncCallback(
    async (disabled: boolean) => {
      if (!targetClass) return;
      setIsLoading(true);

      await restrictClassAccess(targetClass.id, disabled);

      setRestrictModalOpen(false);
      toast({ description: disabled ? 'Acesso da turma restringido!' : 'Acesso da turma habilitado!', status: 'success' });
    },
    [targetClass],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterClass = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const newClass = await createClass(data);

      setClasses((s) => [newClass, ...s]);
      resetCreateForm();
      setCreateOpen(false);
    },
    [data],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveClass = useAsyncCallback(
    async () => {
      if (!targetClass) return;
      setIsLoading(true);

      await removeClass(targetClass.id);

      setClasses((s) => s.filter((e) => e.id !== targetClass.id));
      setTargetClass(null);
      setRemoveOpen(false);
      toast({ status: `success`, description: `Turma removida com sucesso` });
    },
    [targetClass],
    false,
    () => setIsLoading(false),
  );

  const handleResetStudentPassword = useAsyncCallback(
    async () => {
      if (!targetClass) return;
      setIsLoading(true);

      await resetClassPassword(targetClass.id, resetPasswordConfig);

      setResetPasswordOpen(false);
      setResetPasswordConfig({ password: '', force_redefine: false });
      toast({ status: `success`, title: `Senha dos alunos resetada com sucesso`, position: `top-right` });
    },
    [targetClass, resetPasswordConfig],
    false,
    () => setIsLoading(false),
  );

  const handleResetProjects = useAsyncCallback(
    async () => {
      if (!targetClass) return;
      setIsLoading(true);

      await resetProjectsFromClass(targetClass.id);

      setResetProjectsOpen(false);
      toast({ status: `success`, title: `Projetos de fábrica resetados com sucesso`, position: `top-right` });
    },
    [targetClass],
    false,
    () => setIsLoading(false),
  );

  const filteredData = tableData.filter((row) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      row.code?.toLowerCase().includes(q) ||
      row.class_name?.toLowerCase().includes(q) ||
      row.school_name?.toLowerCase().includes(q) ||
      row.grade?.toLowerCase().includes(q)
    );
  });

  const columns: Column<DataType>[] = [
    {
      key: 'nome',
      header: 'Turma',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-brand-turmas/10 grid place-items-center">
            <GraduationCap className="size-4 text-brand-turmas" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">
              {r.class_name}
            </span>
            <span className="text-[11px] text-zinc-400">{r.school_name}</span>
          </div>
        </div>
      ),
    },
    { key: 'ano', header: 'Ano', render: (r) => <span className="text-zinc-700">{formatClassGrade(r.grade)}</span> },
    { key: 'alunos', header: 'Alunos', render: (r) => <span className="text-zinc-700 tabular-nums">{r.student_quantity}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end items-center gap-1">
          <CopyButton
            className="h-8 w-8"
            getText={() =>
              `Esse é o código da ${r.class_name} na escola ${r.school_name}: ${r.code}\nEsse código é usado apenas para cadastro de ALUNOS`
            }
            onCopied={() => toast({ description: 'Código copiado!', status: 'success' })}
          />
          <ActionButton tone="primary" onClick={() => handleOpenClassModal(r.code)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  const schoolOptions = [...schools]
    .sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''))
    .map((s) => ({ value: s.id, label: `${s.display_name || '-'} (${s.school_group?.display_name || '-'})` }));
  const gradeOptions = availableGrades.map((g) => ({ value: g, label: formatClassGrade(g) }));

  return (
    <div className="font-sans">
      <PageHeader
        title="Turmas"
        description="Turmas organizadas por escola dentro de cada rede."
        actions={
          <PrimaryButton onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Nova Turma
          </PrimaryButton>
        }
      />

      <div className="mb-4 max-w-xs relative">
        <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, turma, escola ou ano"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-turmas/30 focus:border-brand-turmas transition"
        />
      </div>

      <DataTable columns={columns} data={filteredData} empty={isLoading ? 'Carregando...' : 'Nenhuma turma cadastrada.'} />

      {/* View / Edit modal */}
      <Modal
        open={!!targetClass}
        onClose={() => setTargetClass(null)}
        title={targetClass?.display_name ?? 'Turma'}
        width="max-w-2xl"
        footer={
          <>
            <CancelButton onClick={() => setTargetClass(null)} />
            <SubmitButton onClick={handleUpdateClass} disabled={!targetClass?.display_name?.trim()} brandClass="bg-brand-turmas">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetClass && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Escola">
                <TextField value={targetClass.hub_school?.display_name ?? '-'} readOnly />
              </Field>
              <Field label="Ano">
                <TextField value={formatClassGrade(targetClass.grade)} readOnly />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome" required>
                <TextField value={targetClass.display_name} onChange={(v) => setTargetClass((e) => (e ? { ...e, display_name: v } : e))} />
              </Field>
              <Field label="Código de acesso">
                <TextField value={targetClass.code} readOnly />
              </Field>
            </div>
            <Field label="Descrição">
              <TextField
                value={targetClass.description ?? ''}
                onChange={(v) => setTargetClass((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <GhostButton onClick={() => setRestrictModalOpen(true)}>
                <ShieldOff className="size-4" /> Gerenciar acessos
              </GhostButton>
              <GhostButton onClick={() => setResetPasswordOpen(true)}>
                <KeyRound className="size-4" /> Resetar senhas
              </GhostButton>
              <GhostButton onClick={() => setResetProjectsOpen(true)}>
                <RotateCcw className="size-4" /> Resetar projetos
              </GhostButton>
              <GhostButton tone="danger" onClick={() => setRemoveOpen(true)}>
                <Trash2 className="size-4" /> Excluir turma
              </GhostButton>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Alunos desta turma</h3>
              <div className="rounded-xl ring-1 ring-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Aluno</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Usuário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {targetClass.students.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                          Nenhum aluno vinculado a esta turma.
                        </td>
                      </tr>
                    ) : (
                      targetClass.students.map((student) => (
                        <tr key={student.id} className="hover:bg-muted/60">
                          <td className="px-4 py-2.5 text-foreground">{student.name}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{student.username}</td>
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
        title="Resetar senha dos alunos"
        width="max-w-md"
        footer={
          <>
            <CancelButton onClick={() => setResetPasswordOpen(false)} />
            <SubmitButton onClick={handleResetStudentPassword} disabled={!resetPasswordConfig.password} brandClass="bg-brand-turmas">
              Confirmar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para continuar, defina uma nova senha para todos os alunos da turma {targetClass?.display_name} e a obrigatoriedade de redefinição.
          </p>
          <Field label="Nova senha" required error={!resetPasswordConfig.password ? 'Campo obrigatório' : undefined}>
            <TextField value={resetPasswordConfig.password} onChange={(v) => setResetPasswordConfig((c) => ({ ...c, password: v }))} />
          </Field>
          <Field label="Obrigar o aluno a redefinir a senha no próximo login?">
            <RadioGroup
              value={resetPasswordConfig.force_redefine ? 'true' : 'false'}
              onChange={(v) => setResetPasswordConfig((c) => ({ ...c, force_redefine: v === 'true' }))}
              options={FORCE_REDEFINE_OPTIONS}
              brandClass="text-brand-turmas border-brand-turmas"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={resetProjectsOpen}
        onClose={() => setResetProjectsOpen(false)}
        onConfirm={handleResetProjects}
        title="Resetar projetos de fábrica"
        description={`Resetar todos os projetos de fábrica na turma ${targetClass?.display_name}? Essa ação é irreversível.`}
        confirmLabel="Resetar"
        tone="neutral"
      />
      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={handleRemoveClass}
        title={`Remover ${targetClass?.display_name ?? 'turma'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />
      <AccessControlModal
        open={restrictModalOpen}
        onClose={() => setRestrictModalOpen(false)}
        title="Acessos da turma"
        description={`Habilita ou restringe o login de todos os alunos da turma ${targetClass?.display_name ?? ''} (uso típico: inadimplência).`}
        onEnable={() => handleRestrictAccess(false)}
        onRestrict={() => handleRestrictAccess(true)}
      />

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          resetCreateForm();
          setCreateOpen(false);
        }}
        title="Registrar turma"
        width="max-w-2xl"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetCreateForm();
                setCreateOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submit(handleRegisterClass)}
              disabled={!data.display_name?.trim() || !data.hub_school_id || !data.grade}
              brandClass="bg-brand-turmas"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Escola" required>
              <SelectField
                value={data.hub_school_id ?? ''}
                onChange={(v) => onInputChange('hub_school_id', v)}
                options={schoolOptions}
                placeholder="Selecione a escola"
              />
            </Field>
            <Field label="Ano" required>
              <SelectField
                value={data.grade ?? ''}
                onChange={(v) => onInputChange('grade', v)}
                options={gradeOptions}
                placeholder="Selecione o ano"
              />
            </Field>
          </div>
          <Field label="Nome" required error={errors.display_name}>
            <TextField
              value={data.display_name ?? ''}
              onChange={(v) => onInputChange('display_name', v)}
              placeholder="Ex: Turma A — Robótica"
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
      </Modal>
    </div>
  );
};

export default Classes;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'classes';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Turmas' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
