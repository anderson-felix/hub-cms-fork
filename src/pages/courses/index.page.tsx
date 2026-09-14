import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { ArrowRight, FileText, Plus, Search, Trash2 } from 'lucide-react';

import { cookieManager, formatClassGrade, formatReadableId, logError, scopeLabelMapper, sortGrades } from '@/_base/utils';
import { useAsyncCallback, useInputHandler } from '@/_base/hooks';
import { getProfile } from '@/_base/services/user';
import { createCourse, listCourses, removeCourse, updateCourse } from '@/_base/services/course';
import { createModule, listModules, removeModule, updateModule } from '@/_base/services/module';
import { createModuleLesson, listModuleLessons, removeModuleLesson, updateModuleLesson } from '@/_base/services/moduleLesson';
import { listVideos } from '@/_base/services/video';
import { getAvailableGrades } from '@/_base/services/admin';
import { listPermissions } from '@/_base/services/permissions';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { EMPTY_COURSE_SCHEMA_DATA, IHubCourse, IRegisterHubCourseParams, IUpdateHubCourseParams, hubCourseSchema } from '@/_base/interfaces/course';
import { EMPTY_HUB_MODULE, IHubModule, IRegisterHubModuleParams, IUpdateHubModuleParams, hubModuleSchema } from '@/_base/interfaces/module';
import {
  IHubModuleLesson,
  IRegisterHubModuleLessonParams,
  IUpdateHubModuleLessonParams,
  hubModuleLessonSchema,
} from '@/_base/interfaces/moduleLesson';
import { IHubVideo } from '@/_base/interfaces/video';
import { IHubPermission } from '@/_base/interfaces/permission';
import { ICertificateTemplate } from '@/_base/interfaces/certificate';
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

type CourseTab = 'cursos' | 'modulos' | 'aulas';

const SCOPE_OPTIONS = [
  { value: 'teacher', label: 'Professor' },
  { value: 'student', label: 'Aluno' },
];

const BRAND_CLASS = 'text-brand-formacoes';
const BRAND_BG_CLASS = 'bg-brand-formacoes/10';
const RING_CLASS = 'focus:ring-brand-formacoes/30 focus:border-brand-formacoes';

async function uploadAndGetPath(file: File): Promise<string> {
  const { link, path } = await getPresignedUrl(file.type, 'courses');
  await uploadFile(link, file);
  return path;
}

type CourseRow = {
  id: string;
  code: string;
  title: string;
  scope_label: string;
  grades_display: string;
  dependency: string;
};

const formatCourseRow = (course: IHubCourse): CourseRow => ({
  id: course.id,
  code: formatReadableId(course.readable_id),
  title: course.title,
  scope_label: scopeLabelMapper[course.scope],
  grades_display: course.grades?.map(formatClassGrade).join(' · ') || '-',
  dependency: course.dependency?.title || '-',
});

type ModuleRow = {
  id: string;
  code: string;
  title: string;
  course_title: string;
  dependency: string;
  lesson_quantity: string;
  position: number;
};

const formatModuleRow = (mod: IHubModule, courses: IHubCourse[]): ModuleRow => ({
  id: mod.id,
  code: formatReadableId(mod.readable_id),
  title: mod.title,
  course_title: mod.course?.title || courses.find((c) => c.id === mod.hub_course_id)?.title || '-',
  dependency: mod.dependency?.title || '-',
  lesson_quantity: `${mod.lessons?.length || 0}`,
  position: mod.position,
});

type LessonRow = {
  id: string;
  code: string;
  title: string;
  module_title: string;
  video_title: string;
  lesson_type: string;
  position: number;
};

const formatLessonRow = (lesson: IHubModuleLesson, modules: IHubModule[], videos: IHubVideo[]): LessonRow => ({
  id: lesson.id,
  code: formatReadableId(lesson.readable_id),
  title: lesson.title,
  module_title: lesson.module?.title || modules.find((e) => e.id === lesson.module_id)?.title || '-',
  video_title: lesson.video?.title || videos.find((e) => e.id === lesson.video_id)?.title || '-',
  lesson_type: lesson.lesson_type,
  position: lesson.position,
});

const Courses: React.FC<IProps> = () => {
  const [tab, setTab] = useState<CourseTab>('cursos');
  const [filter, setFilter] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [courses, setCourses] = useState<IHubCourse[]>([]);
  const [modules, setModules] = useState<IHubModule[]>([]);
  const [lessons, setLessons] = useState<IHubModuleLesson[]>([]);
  const [videos, setVideos] = useState<IHubVideo[]>([]);
  const [permissions, setPermissions] = useState<IHubPermission[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  const [courseRows, setCourseRows] = useState<CourseRow[]>([]);
  const [moduleRows, setModuleRows] = useState<ModuleRow[]>([]);
  const [lessonRows, setLessonRows] = useState<LessonRow[]>([]);

  const [courseSearch, setCourseSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');

  const toast = useToast();

  // ---- Courses ----
  const [targetCourse, setTargetCourse] = useState<IHubCourse | null>(null);
  const [newCourseThumbnail, setNewCourseThumbnail] = useState<File | null>(null);
  const [newCertThumbnail, setNewCertThumbnail] = useState<File | null>(null);
  const [newCertTemplate, setNewCertTemplate] = useState<File | null>(null);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [removeCourseOpen, setRemoveCourseOpen] = useState(false);

  const {
    data: courseData,
    errors: courseErrors,
    setErrors: setCourseErrors,
    onInputChange: onCourseInputChange,
    submit: submitCourse,
    setData: setCourseData,
  } = useInputHandler({ data: EMPTY_COURSE_SCHEMA_DATA, schema: hubCourseSchema });

  // ---- Modules ----
  const [targetModule, setTargetModule] = useState<IHubModule | null>(null);
  const [createModuleOpen, setCreateModuleOpen] = useState(false);
  const [removeModuleOpen, setRemoveModuleOpen] = useState(false);

  const {
    data: moduleData,
    errors: moduleErrors,
    setErrors: setModuleErrors,
    onInputChange: onModuleInputChange,
    submit: submitModule,
    setData: setModuleData,
  } = useInputHandler({ data: EMPTY_HUB_MODULE, schema: hubModuleSchema });

  // ---- Lessons ----
  const [targetLesson, setTargetLesson] = useState<IHubModuleLesson | null>(null);
  const [createLessonOpen, setCreateLessonOpen] = useState(false);
  const [removeLessonOpen, setRemoveLessonOpen] = useState(false);

  const {
    data: lessonData,
    errors: lessonErrors,
    setErrors: setLessonErrors,
    onInputChange: onLessonInputChange,
    submit: submitLesson,
    setData: setLessonData,
  } = useInputHandler<IRegisterHubModuleLessonParams>({ schema: hubModuleLessonSchema });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [{ results: courseRes }, { results: moduleRes }, { results: lessonRes }, { results: videoRes }, grades, { results: permissionRes }] =
        await Promise.all([listCourses(), listModules(), listModuleLessons(), listVideos(), getAvailableGrades(), listPermissions()]);
      setCourses(courseRes);
      setModules(moduleRes);
      setLessons(lessonRes);
      setVideos(videoRes);
      setPermissions(permissionRes);
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

  useEffect(() => setCourseRows(courses.map(formatCourseRow)), [courses]);
  useEffect(() => {
    const filtered = filter.hub_course_id ? modules.filter((m) => m.hub_course_id === filter.hub_course_id) : modules;
    setModuleRows(filtered.map((m) => formatModuleRow(m, courses)));
  }, [modules, courses, filter]);
  useEffect(() => {
    const filtered = filter.module_id ? lessons.filter((l) => l.module_id === filter.module_id) : lessons;
    setLessonRows(filtered.map((l) => formatLessonRow(l, modules, videos)));
  }, [lessons, modules, videos, filter]);

  const handleTabChange = (v: string) => {
    setTab(v as CourseTab);
    setFilter({});
  };

  const goToModules = (courseId: string) => {
    setFilter({ hub_course_id: courseId });
    setTab('modulos');
  };

  const goToLessons = (moduleId: string) => {
    setFilter({ module_id: moduleId });
    setTab('aulas');
  };

  const resetCourseCreateForm = () => {
    setCourseData(EMPTY_COURSE_SCHEMA_DATA);
    setCourseErrors({} as any);
    setNewCourseThumbnail(null);
    setNewCertThumbnail(null);
    setNewCertTemplate(null);
  };

  const resetModuleCreateForm = () => {
    setModuleData(EMPTY_HUB_MODULE);
    setModuleErrors({} as any);
  };

  const resetLessonCreateForm = () => {
    setLessonData({} as any);
    setLessonErrors({} as any);
  };

  // ---- Course handlers ----
  const handleOpenCourseModal = (id: string) => {
    const course = courses.find((e) => e.id === id);
    if (course) {
      setTargetCourse(course);
      setNewCourseThumbnail(null);
      setNewCertThumbnail(null);
      setNewCertTemplate(null);
    }
  };

  const handleUpdateCourse = useAsyncCallback(
    async () => {
      if (!targetCourse) return;
      setIsLoading(true);

      const dto: IUpdateHubCourseParams = {
        id: targetCourse.id,
        title: targetCourse.title,
        description: targetCourse.description || undefined,
        dependency_id: targetCourse.dependency_id || undefined,
        permissions: targetCourse.content_permission_links?.map((link) => link.permission.id),
        certificate_templates: targetCourse.certificate_templates,
      };

      if (newCourseThumbnail) dto.thumbnail = await uploadAndGetPath(newCourseThumbnail);

      if (newCertThumbnail || newCertTemplate) {
        const template: ICertificateTemplate = dto.certificate_templates?.[0] || { link: '', title: '', thumbnail: '' };
        if (newCertThumbnail) template.thumbnail = await uploadAndGetPath(newCertThumbnail);
        if (newCertTemplate) template.link = await uploadAndGetPath(newCertTemplate);
        dto.certificate_templates = [template];
      }

      const updatedCourse = await updateCourse(dto);

      setCourses((s) => s.map((e) => (e.id === updatedCourse.id ? { ...targetCourse, ...updatedCourse } : e)));
      setTargetCourse(null);
      setNewCourseThumbnail(null);
      setNewCertThumbnail(null);
      setNewCertTemplate(null);

      toast({ description: 'Curso atualizado!', status: 'success' });
    },
    [targetCourse, newCourseThumbnail, newCertThumbnail, newCertTemplate],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterCourse = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const payload: IRegisterHubCourseParams = { ...courseData };

      if (newCourseThumbnail) payload.thumbnail = await uploadAndGetPath(newCourseThumbnail);

      if (newCertThumbnail || newCertTemplate) {
        const template: ICertificateTemplate = payload.certificate_templates?.[0] || { link: '', title: '', thumbnail: '' };
        if (newCertThumbnail) template.thumbnail = await uploadAndGetPath(newCertThumbnail);
        if (newCertTemplate) template.link = await uploadAndGetPath(newCertTemplate);
        payload.certificate_templates = [template];
      }

      const newCourse = await createCourse(payload);

      setCourses((s) => [newCourse, ...s]);
      resetCourseCreateForm();
      setCreateCourseOpen(false);

      toast({ description: 'Curso criado!', status: 'success' });
    },
    [courseData, newCourseThumbnail, newCertThumbnail, newCertTemplate],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveCourse = useAsyncCallback(
    async () => {
      if (!targetCourse) return;
      setIsLoading(true);

      await removeCourse(targetCourse.id);

      setCourses((s) => s.filter((e) => e.id !== targetCourse.id));
      setTargetCourse(null);
      setRemoveCourseOpen(false);
      toast({ description: 'Curso removido!', status: 'success' });
    },
    [targetCourse],
    false,
    () => setIsLoading(false),
  );

  // ---- Module handlers ----
  const handleOpenModuleModal = (id: string) => {
    const mod = modules.find((e) => e.id === id);
    if (mod) setTargetModule(mod);
  };

  const handleUpdateModule = useAsyncCallback(
    async () => {
      if (!targetModule) return;
      setIsLoading(true);

      const dto: IUpdateHubModuleParams = {
        id: targetModule.id,
        title: targetModule.title,
        description: targetModule.description || undefined,
        position: targetModule.position,
      };

      const updatedModule = await updateModule(dto);

      setModules((s) => s.map((e) => (e.id === updatedModule.id ? { ...targetModule, ...updatedModule } : e)));
      setTargetModule(null);

      toast({ description: 'Módulo atualizado!', status: 'success' });
    },
    [targetModule],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterModule = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const newModule = await createModule(moduleData);

      setModules((s) => [newModule, ...s]);
      resetModuleCreateForm();
      setCreateModuleOpen(false);

      toast({ description: 'Módulo criado!', status: 'success' });
    },
    [moduleData],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveModule = useAsyncCallback(
    async () => {
      if (!targetModule) return;
      setIsLoading(true);

      await removeModule(targetModule.id);

      setModules((s) => s.filter((e) => e.id !== targetModule.id));
      setTargetModule(null);
      setRemoveModuleOpen(false);
      toast({ description: 'Módulo removido!', status: 'success' });
    },
    [targetModule],
    false,
    () => setIsLoading(false),
  );

  // ---- Lesson handlers ----
  const handleOpenLessonModal = (id: string) => {
    const lesson = lessons.find((e) => e.id === id);
    if (lesson) setTargetLesson(lesson);
  };

  const handleUpdateLesson = useAsyncCallback(
    async () => {
      if (!targetLesson) return;
      setIsLoading(true);

      const dto: IUpdateHubModuleLessonParams = {
        id: targetLesson.id,
        title: targetLesson.title,
        description: targetLesson.description || undefined,
        position: targetLesson.position,
        video_id: targetLesson.video_id || undefined,
      };

      const updatedLesson = await updateModuleLesson(dto);

      setLessons((s) => s.map((e) => (e.id === updatedLesson.id ? { ...targetLesson, ...updatedLesson } : e)));
      setTargetLesson(null);

      toast({ description: 'Atividade atualizada!', status: 'success' });
    },
    [targetLesson],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterLesson = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const newLesson = await createModuleLesson({ ...lessonData, lesson_type: 'video', metadata: lessonData.metadata || {} });

      setLessons((s) => [newLesson, ...s]);
      resetLessonCreateForm();
      setCreateLessonOpen(false);

      toast({ description: 'Atividade criada!', status: 'success' });
    },
    [lessonData],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveLesson = useAsyncCallback(
    async () => {
      if (!targetLesson) return;
      setIsLoading(true);

      await removeModuleLesson(targetLesson.id);

      setLessons((s) => s.filter((e) => e.id !== targetLesson.id));
      setTargetLesson(null);
      setRemoveLessonOpen(false);
      toast({ description: 'Atividade removida!', status: 'success' });
    },
    [targetLesson],
    false,
    () => setIsLoading(false),
  );

  const filteredCourses = courseRows.filter((row) => {
    if (!courseSearch.trim()) return true;
    const q = courseSearch.trim().toLowerCase();
    return row.code.toLowerCase().includes(q) || row.title?.toLowerCase().includes(q) || row.scope_label?.toLowerCase().includes(q);
  });

  const filteredModules = moduleRows.filter((row) => {
    if (!moduleSearch.trim()) return true;
    const q = moduleSearch.trim().toLowerCase();
    return row.code.toLowerCase().includes(q) || row.title?.toLowerCase().includes(q) || row.course_title?.toLowerCase().includes(q);
  });

  const filteredLessons = lessonRows.filter((row) => {
    if (!lessonSearch.trim()) return true;
    const q = lessonSearch.trim().toLowerCase();
    return row.code.toLowerCase().includes(q) || row.title?.toLowerCase().includes(q) || row.module_title?.toLowerCase().includes(q);
  });

  const permissionOptions = permissions.map((p) => ({ value: p.id, label: p.title }));
  const gradeOptions = availableGrades.map((g) => ({ value: g, label: formatClassGrade(g) }));
  const courseOptions = courses.map((c) => ({ value: c.id, label: c.title }));
  const moduleOptions = modules.map((m) => ({ value: m.id, label: `${m.title} (${m.course?.title || ''})` }));
  const videoOptions = videos.map((v) => ({ value: v.id, label: `${v.title} (${v.category?.display_name || ''})` }));

  const courseColumns: Column<CourseRow>[] = [
    {
      key: 'curso',
      header: 'Curso',
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-zinc-900">{r.title}</span>
          <span className="text-[11px] text-zinc-400">Código {r.code}</span>
        </div>
      ),
    },
    { key: 'escopo', header: 'Escopo', render: (r) => <span className="text-zinc-600">{r.scope_label}</span> },
    { key: 'anos', header: 'Anos', render: (r) => <span className="text-zinc-600">{r.grades_display}</span> },
    { key: 'dependencia', header: 'Dependência', render: (r) => <span className="text-zinc-600">{r.dependency}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <ActionButton tone="primary" onClick={() => goToModules(r.id)}>
            Ver módulos <ArrowRight className="inline size-3" />
          </ActionButton>
          <ActionButton tone="primary" onClick={() => handleOpenCourseModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  const moduleColumns: Column<ModuleRow>[] = [
    {
      key: 'modulo',
      header: 'Módulo',
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-zinc-900">{r.title}</span>
          <span className="text-[11px] text-zinc-400">Código {r.code}</span>
        </div>
      ),
    },
    { key: 'curso', header: 'Curso', render: (r) => <span className="text-zinc-600">{r.course_title}</span> },
    { key: 'dependencia', header: 'Dependência', render: (r) => <span className="text-zinc-600">{r.dependency}</span> },
    { key: 'atividades', header: 'Atividades', render: (r) => <span className="text-zinc-600 tabular-nums">{r.lesson_quantity}</span> },
    { key: 'posicao', header: 'Posição', render: (r) => <span className="text-zinc-600 tabular-nums">{r.position}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <ActionButton tone="primary" onClick={() => goToLessons(r.id)}>
            Ver atividades <ArrowRight className="inline size-3" />
          </ActionButton>
          <ActionButton tone="primary" onClick={() => handleOpenModuleModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  const lessonColumns: Column<LessonRow>[] = [
    {
      key: 'atividade',
      header: 'Atividade',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-brand-formacoes/10 grid place-items-center shrink-0">
            <FileText className="size-4 text-brand-formacoes" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">{r.title}</span>
            <span className="text-[11px] text-zinc-400">Código {r.code}</span>
          </div>
        </div>
      ),
    },
    { key: 'modulo', header: 'Módulo', render: (r) => <span className="text-zinc-600">{r.module_title}</span> },
    { key: 'video', header: 'Vídeo', render: (r) => <span className="text-zinc-600">{r.video_title}</span> },
    { key: 'tipo', header: 'Tipo', render: (r) => <span className="text-zinc-600">{r.lesson_type}</span> },
    { key: 'posicao', header: 'Posição', render: (r) => <span className="text-zinc-600 tabular-nums">{r.position}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenLessonModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="font-sans">
      <PageHeader
        title="Formações"
        description="Gerencie cursos, módulos e atividades da plataforma."
        actions={
          tab === 'cursos' ? (
            <PrimaryButton onClick={() => setCreateCourseOpen(true)}>
              <Plus className="size-4" /> Novo Curso
            </PrimaryButton>
          ) : tab === 'modulos' ? (
            <PrimaryButton onClick={() => setCreateModuleOpen(true)}>
              <Plus className="size-4" /> Novo Módulo
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => setCreateLessonOpen(true)}>
              <Plus className="size-4" /> Nova Atividade
            </PrimaryButton>
          )
        }
      />

      <Tabs
        items={[
          { value: 'cursos', label: 'Cursos' },
          { value: 'modulos', label: 'Módulos' },
          { value: 'aulas', label: 'Atividades' },
        ]}
        value={tab}
        onChange={handleTabChange}
        brandClass={BRAND_CLASS}
      />

      {tab === 'cursos' ? (
        <>
          <div className="mb-4 max-w-xs relative">
            <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Buscar por código, título ou escopo"
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
            />
          </div>
          <DataTable columns={courseColumns} data={filteredCourses} empty={isLoading ? 'Carregando...' : 'Nenhum curso cadastrado.'} />
        </>
      ) : tab === 'modulos' ? (
        <>
          <div className="mb-4 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Buscar por código, título ou curso"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
              />
            </div>
            {filter.hub_course_id && (
              <ActionButton onClick={() => setFilter({})}>Limpar filtro de curso</ActionButton>
            )}
          </div>
          <DataTable columns={moduleColumns} data={filteredModules} empty={isLoading ? 'Carregando...' : 'Nenhum módulo cadastrado.'} />
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                placeholder="Buscar por código, título ou módulo"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
              />
            </div>
            {filter.module_id && <ActionButton onClick={() => setFilter({})}>Limpar filtro de módulo</ActionButton>}
          </div>
          <DataTable columns={lessonColumns} data={filteredLessons} empty={isLoading ? 'Carregando...' : 'Nenhuma atividade cadastrada.'} />
        </>
      )}

      {/* ------------------- Course view / edit modal ------------------- */}
      <Modal
        open={!!targetCourse}
        onClose={() => setTargetCourse(null)}
        title={targetCourse?.title ?? 'Curso'}
        width="max-w-2xl"
        footer={
          <>
            <CancelButton onClick={() => setTargetCourse(null)} />
            <SubmitButton onClick={handleUpdateCourse} disabled={!targetCourse?.title?.trim()} brandClass="bg-brand-formacoes">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetCourse && (
          <div className="space-y-5">
            <Field label="Escopo do curso">
              <TextField value={targetCourse.scope ? scopeLabelMapper[targetCourse.scope] : '-'} readOnly />
            </Field>
            <Field label="Nome" required>
              <TextField value={targetCourse.title} onChange={(v) => setTargetCourse((e) => (e ? { ...e, title: v } : e))} />
            </Field>
            <Field label="Descrição">
              <TextField
                value={targetCourse.description ?? ''}
                onChange={(v) => setTargetCourse((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Dependência">
                <TextField value={targetCourse.dependency?.title || '-'} readOnly />
              </Field>
              <Field label="Anos">
                <TextField value={targetCourse.grades?.map(formatClassGrade).join(', ') || '-'} readOnly />
              </Field>
            </div>
            <Field label="Permissões">
              <MultiSelect
                options={permissionOptions}
                value={targetCourse.content_permission_links?.map((l) => l.permission.id) ?? []}
                onChange={(ids) =>
                  setTargetCourse((e) =>
                    e ? { ...e, content_permission_links: ids.map((id) => ({ id, permission: permissions.find((p) => p.id === id) }) as any) } : e,
                  )
                }
                placeholder="Selecione as permissões"
                brandClass={BRAND_CLASS}
                brandBgClass={BRAND_BG_CLASS}
                ringClass={RING_CLASS}
              />
            </Field>

            <Field label="Thumbnail">
              <div className="space-y-2">
                {targetCourse.thumbnail && (
                  <img src={targetCourse.thumbnail} alt="Thumbnail atual" className="h-24 rounded-lg ring-1 ring-border object-cover" />
                )}
                <FileField accept="image/*" fileName={newCourseThumbnail?.name} onChange={setNewCourseThumbnail} brandClass={BRAND_CLASS} />
              </div>
            </Field>

            <div className="rounded-lg border border-border p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">Template de certificado</p>
              <Field label="Título do certificado">
                <TextField
                  value={targetCourse.certificate_templates?.[0]?.title || ''}
                  onChange={(title) =>
                    setTargetCourse((c) =>
                      c ? { ...c, certificate_templates: [{ ...(c.certificate_templates?.[0] || {}), title } as ICertificateTemplate] } : c,
                    )
                  }
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Thumbnail do certificado">
                  <div className="space-y-2">
                    {targetCourse.certificate_templates?.[0]?.thumbnail && (
                      <img
                        src={targetCourse.certificate_templates[0].thumbnail}
                        alt="Thumbnail do certificado"
                        className="h-20 rounded-lg ring-1 ring-border object-cover"
                      />
                    )}
                    <FileField accept="image/*" fileName={newCertThumbnail?.name} onChange={setNewCertThumbnail} brandClass={BRAND_CLASS} />
                  </div>
                </Field>
                <Field label="Template (PDF)">
                  <div className="space-y-2">
                    {targetCourse.certificate_templates?.[0]?.link && (
                      <a
                        href={targetCourse.certificate_templates[0].link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-input text-zinc-600 hover:bg-muted transition"
                      >
                        <FileText className="size-3.5" /> Ver template atual
                      </a>
                    )}
                    <FileField accept="application/pdf" fileName={newCertTemplate?.name} onChange={setNewCertTemplate} brandClass={BRAND_CLASS} />
                  </div>
                </Field>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemoveCourseOpen(true)}>
                <Trash2 className="size-4" /> Excluir curso
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeCourseOpen}
        onClose={() => setRemoveCourseOpen(false)}
        onConfirm={handleRemoveCourse}
        title={`Remover ${targetCourse?.title ?? 'curso'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* ------------------- Course create modal ------------------- */}
      <Modal
        open={createCourseOpen}
        onClose={() => {
          resetCourseCreateForm();
          setCreateCourseOpen(false);
        }}
        title="Registrar curso"
        width="max-w-2xl"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetCourseCreateForm();
                setCreateCourseOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitCourse(handleRegisterCourse)}
              disabled={!courseData.title?.trim() || !courseData.scope || !courseData.grades?.length}
              brandClass="bg-brand-formacoes"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Escopo do curso" required error={courseErrors.scope}>
            <RadioGroup
              value={courseData.scope ?? ''}
              onChange={(v) => onCourseInputChange('scope', v)}
              options={SCOPE_OPTIONS}
              brandClass={`${BRAND_CLASS} border-brand-formacoes`}
            />
          </Field>
          <Field label="Nome" required error={courseErrors.title}>
            <TextField
              value={courseData.title}
              onChange={(v) => onCourseInputChange('title', v)}
              placeholder="Ex: Introdução ao Python"
              error={courseErrors.title}
            />
          </Field>
          <Field label="Descrição" error={courseErrors.description}>
            <TextField
              value={courseData.description}
              onChange={(v) => onCourseInputChange('description', v)}
              placeholder="Descrição opcional"
              error={courseErrors.description}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Dependência (opcional)" error={courseErrors.dependency_id}>
              <SelectField
                value={courseData.dependency_id}
                onChange={(v) => onCourseInputChange('dependency_id', v)}
                options={courseOptions}
                placeholder="Selecione a dependência"
                error={courseErrors.dependency_id}
              />
            </Field>
            <Field label="Anos" required error={courseErrors.grades as any}>
              <MultiSelect
                options={gradeOptions}
                value={courseData.grades}
                onChange={(v) => onCourseInputChange('grades', v)}
                placeholder="Selecione os anos"
                brandClass={BRAND_CLASS}
                brandBgClass={BRAND_BG_CLASS}
                ringClass={RING_CLASS}
              />
            </Field>
          </div>
          <Field label="Permissões">
            <MultiSelect
              options={permissionOptions}
              value={courseData.permissions}
              onChange={(v) => onCourseInputChange('permissions', v)}
              placeholder="Selecione as permissões"
              brandClass={BRAND_CLASS}
              brandBgClass={BRAND_BG_CLASS}
              ringClass={RING_CLASS}
            />
          </Field>
          <Field label="Thumbnail do curso">
            <FileField accept="image/*" fileName={newCourseThumbnail?.name} onChange={setNewCourseThumbnail} brandClass={BRAND_CLASS} />
          </Field>

          <div className="rounded-lg border border-border p-4 space-y-4">
            <p className="text-sm font-semibold text-foreground">Template de certificado</p>
            <Field label="Título do certificado">
              <TextField
                value={courseData.certificate_templates?.[0]?.title || ''}
                onChange={(title) =>
                  onCourseInputChange('certificate_templates', [
                    { ...(courseData.certificate_templates?.[0] || {}), title } as ICertificateTemplate,
                  ])
                }
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Thumbnail do certificado">
                <FileField accept="image/*" fileName={newCertThumbnail?.name} onChange={setNewCertThumbnail} brandClass={BRAND_CLASS} />
              </Field>
              <Field label="Template (PDF)">
                <FileField accept="application/pdf" fileName={newCertTemplate?.name} onChange={setNewCertTemplate} brandClass={BRAND_CLASS} />
              </Field>
            </div>
          </div>
        </div>
      </Modal>

      {/* ------------------- Module view / edit modal ------------------- */}
      <Modal
        open={!!targetModule}
        onClose={() => setTargetModule(null)}
        title={targetModule?.title ?? 'Módulo'}
        footer={
          <>
            <CancelButton onClick={() => setTargetModule(null)} />
            <SubmitButton onClick={handleUpdateModule} disabled={!targetModule?.title?.trim()} brandClass="bg-brand-formacoes">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetModule && (
          <div className="space-y-5">
            <Field label="Nome" required>
              <TextField value={targetModule.title} onChange={(v) => setTargetModule((e) => (e ? { ...e, title: v } : e))} />
            </Field>
            <Field label="Descrição">
              <TextField
                value={targetModule.description ?? ''}
                onChange={(v) => setTargetModule((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>
            <Field label="Posição" required>
              <input
                type="number"
                min={0}
                value={targetModule.position}
                onChange={(e) => setTargetModule((c) => (c ? { ...c, position: Number(e.target.value) } : c))}
                className={`w-24 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Dependência">
                <TextField value={targetModule.dependency?.title || '-'} readOnly />
              </Field>
              <Field label="Curso">
                <TextField value={targetModule.course?.title || '-'} readOnly />
              </Field>
            </div>
            <div className="pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemoveModuleOpen(true)}>
                <Trash2 className="size-4" /> Excluir módulo
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeModuleOpen}
        onClose={() => setRemoveModuleOpen(false)}
        onConfirm={handleRemoveModule}
        title={`Remover ${targetModule?.title ?? 'módulo'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* ------------------- Module create modal ------------------- */}
      <Modal
        open={createModuleOpen}
        onClose={() => {
          resetModuleCreateForm();
          setCreateModuleOpen(false);
        }}
        title="Registrar módulo"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetModuleCreateForm();
                setCreateModuleOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitModule(handleRegisterModule)}
              disabled={!moduleData.title?.trim() || !moduleData.hub_course_id}
              brandClass="bg-brand-formacoes"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Nome" required error={moduleErrors.title}>
            <TextField
              value={moduleData.title}
              onChange={(v) => onModuleInputChange('title', v)}
              placeholder="Ex: Módulo 1 - Fundamentos"
              error={moduleErrors.title}
            />
          </Field>
          <Field label="Descrição" error={moduleErrors.description}>
            <TextField
              value={moduleData.description ?? ''}
              onChange={(v) => onModuleInputChange('description', v)}
              placeholder="Descrição opcional"
              error={moduleErrors.description}
            />
          </Field>
          <Field label="Posição" required>
            <input
              type="number"
              min={0}
              value={moduleData.position ?? 0}
              onChange={(e) => onModuleInputChange('position', Number(e.target.value))}
              className={`w-24 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Dependência (opcional)" error={moduleErrors.dependency_id}>
              <SelectField
                value={moduleData.dependency_id ?? ''}
                onChange={(v) => onModuleInputChange('dependency_id', v)}
                options={moduleOptions}
                placeholder="Selecione a dependência"
                error={moduleErrors.dependency_id}
              />
            </Field>
            <Field label="Curso" required error={moduleErrors.hub_course_id}>
              <SelectField
                value={moduleData.hub_course_id}
                onChange={(v) => onModuleInputChange('hub_course_id', v)}
                options={courseOptions}
                placeholder="Selecione o curso"
                error={moduleErrors.hub_course_id}
              />
            </Field>
          </div>
        </div>
      </Modal>

      {/* ------------------- Lesson view / edit modal ------------------- */}
      <Modal
        open={!!targetLesson}
        onClose={() => setTargetLesson(null)}
        title={targetLesson?.title ?? 'Atividade'}
        footer={
          <>
            <CancelButton onClick={() => setTargetLesson(null)} />
            <SubmitButton onClick={handleUpdateLesson} disabled={!targetLesson?.title?.trim()} brandClass="bg-brand-formacoes">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetLesson && (
          <div className="space-y-5">
            <Field label="Nome" required>
              <TextField value={targetLesson.title} onChange={(v) => setTargetLesson((e) => (e ? { ...e, title: v } : e))} />
            </Field>
            <Field label="Descrição" error={lessonErrors.description}>
              <TextField
                value={targetLesson.description ?? ''}
                onChange={(v) => setTargetLesson((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>
            <Field label="Posição" required>
              <input
                type="number"
                min={0}
                value={targetLesson.position}
                onChange={(e) => setTargetLesson((c) => (c ? { ...c, position: Number(e.target.value) } : c))}
                className={`w-24 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
              />
            </Field>
            <Field label="Módulo">
              <TextField value={targetLesson.module?.title || '-'} readOnly />
            </Field>
            <Field label="Vídeo" error={lessonErrors.video_id}>
              <SelectField
                value={targetLesson.video_id ?? ''}
                onChange={(v) => setTargetLesson((e) => (e ? { ...e, video_id: v } : e))}
                options={videoOptions}
                placeholder="Selecione o vídeo"
                error={lessonErrors.video_id}
              />
            </Field>
            <div className="pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemoveLessonOpen(true)}>
                <Trash2 className="size-4" /> Excluir atividade
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeLessonOpen}
        onClose={() => setRemoveLessonOpen(false)}
        onConfirm={handleRemoveLesson}
        title={`Remover ${targetLesson?.title ?? 'atividade'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* ------------------- Lesson create modal ------------------- */}
      <Modal
        open={createLessonOpen}
        onClose={() => {
          resetLessonCreateForm();
          setCreateLessonOpen(false);
        }}
        title="Registrar atividade"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetLessonCreateForm();
                setCreateLessonOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitLesson(handleRegisterLesson)}
              disabled={!lessonData.title?.trim() || !lessonData.module_id}
              brandClass="bg-brand-formacoes"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Nome" required error={lessonErrors.title}>
            <TextField
              value={lessonData.title}
              onChange={(v) => onLessonInputChange('title', v)}
              placeholder="Ex: Variáveis e tipos"
              error={lessonErrors.title}
            />
          </Field>
          <Field label="Descrição" error={lessonErrors.description}>
            <TextField
              value={lessonData.description ?? ''}
              onChange={(v) => onLessonInputChange('description', v)}
              placeholder="Descrição opcional"
              error={lessonErrors.description}
            />
          </Field>
          <Field label="Posição">
            <input
              type="number"
              min={0}
              value={lessonData.position ?? 0}
              onChange={(e) => onLessonInputChange('position', Number(e.target.value))}
              className={`w-24 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 transition ${RING_CLASS}`}
            />
          </Field>
          <Field label="Módulo" required error={lessonErrors.module_id}>
            <SelectField
              value={lessonData.module_id}
              onChange={(v) => onLessonInputChange('module_id', v)}
              options={moduleOptions}
              placeholder="Selecione o módulo"
              error={lessonErrors.module_id}
            />
          </Field>
          <Field label="Vídeo" error={lessonErrors.video_id}>
            <SelectField
              value={lessonData.video_id ?? ''}
              onChange={(v) => onLessonInputChange('video_id', v)}
              options={videoOptions}
              placeholder="Selecione o vídeo"
              error={lessonErrors.video_id}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

export default Courses;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'courses';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Formações' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
