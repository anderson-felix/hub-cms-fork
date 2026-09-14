import React, { useCallback, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { Container, Content } from './styles';
import { Flex, useToast } from '@chakra-ui/react';

import { cookieManager, logError, sortGrades } from '@/_base/utils';
import { useAsyncCallback } from '@/_base/hooks';
import { GenericButton } from '@/components/Buttons/Generic';
import { IHubCourse, IRegisterHubCourseParams, IUpdateHubCourseParams } from '@/_base/interfaces/course';
import { createCourse, listCourses, removeCourse, updateCourse } from '@/_base/services/course';
import { getProfile } from '@/_base/services/user';
import { getAvailableGrades } from '@/_base/services/admin';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { TabSwitch } from '@/components/TabSwitch';
import { CoursePageViewType, coursePageViewLabelMapper, coursePageViewOptions } from './interfaces';
import { CoursesTable } from './components/courses';
import { ModulesTable } from './components/modules';
import { IHubModule, IRegisterHubModuleParams, IUpdateHubModuleParams } from '@/_base/interfaces/module';
import { IHubVideo } from '@/_base/interfaces/video';
import { createModule, listModules, removeModule, updateModule } from '@/_base/services/module';
import { createModuleLesson, listModuleLessons, removeModuleLesson, updateModuleLesson } from '@/_base/services/moduleLesson';
import { listVideos } from '@/_base/services/video';
import { IHubModuleLesson, IRegisterHubModuleLessonParams, IUpdateHubModuleLessonParams } from '@/_base/interfaces/moduleLesson';
import { LessonsTable } from './components/lessons';
import { listPermissions } from '@/_base/services/permissions';
import { IHubPermission } from '@/_base/interfaces/permission';

const Courses: React.FC = () => {
  const [pageView, setPageView] = useState<CoursePageViewType>(`course`);

  const [courses, setCourses] = useState<IHubCourse[]>([]);
  const [modules, setModules] = useState<IHubModule[]>([]);
  const [lessons, setLessons] = useState<IHubModuleLesson[]>([]);
  const [videos, setVideos] = useState<IHubVideo[]>([]);
  const [permissions, setPermissions] = useState<IHubPermission[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openCourseModal, setOpenCourseModal] = useState(false);
  const [openModuleModal, setOpenModuleModal] = useState(false);
  const [openLessonModal, setOpenLessonModal] = useState(false);

  const toast = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ results: courseRes }, { results: moduleRes }, { results: lessonRes }, { results: videoRes }, grades, { results: permissionRes }] =
        await Promise.all([listCourses(), listModules(), listModuleLessons(), listVideos(), getAvailableGrades(), listPermissions()]);
      setCourses(courseRes);
      setPermissions(permissionRes);
      setModules(moduleRes);
      setLessons(lessonRes);
      setVideos(videoRes);
      setAvailableGrades(sortGrades(grades));
    } catch {
      toast({ status: `error`, description: `Ocorreu um erro` });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateCourse = useAsyncCallback(
    async (dto: IUpdateHubCourseParams, file?: File | null) => {
      setIsLoading(true);

      if (file) {
        const response = await getPresignedUrl(file.type, 'courses');
        await uploadFile(response.link, file);
        dto.thumbnail = response.path;
      } else {
        dto.thumbnail = undefined;
      }
      await updateCourse(dto);
      await fetchData();
    },
    [],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterCourse = useAsyncCallback(
    async (dto: IRegisterHubCourseParams, file?: File | null) => {
      setIsLoading(true);
      if (file) {
        const response = await getPresignedUrl(file.type, 'courses');
        await uploadFile(response.link, file);
        dto.thumbnail = response.path;
      }

      await createCourse(dto);
      await fetchData();
      setOpenCourseModal(false);
    },
    [],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveCourse = useAsyncCallback(
    async (course: IHubCourse) => {
      setIsLoading(true);

      await removeCourse(course.id);
      await fetchData();
    },
    [],
    false,
    () => setIsLoading(false),
  );

  const handleUpdateModule = useAsyncCallback(
    async (dto: IUpdateHubModuleParams) => {
      setIsLoading(true);
      await updateModule(dto);
      await fetchData();
    },
    [],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterModule = useAsyncCallback(
    async (dto: IRegisterHubModuleParams) => {
      setIsLoading(true);
      await createModule(dto);
      await fetchData();
      setOpenModuleModal(false);
    },
    [],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveModule = useAsyncCallback(
    async (mod: IHubModule) => {
      setIsLoading(true);
      await removeModule(mod.id);
      await fetchData();
    },
    [],
    false,
    () => setIsLoading(false),
  );

  const handleUpdateLesson = useAsyncCallback(
    async (dto: IUpdateHubModuleLessonParams) => {
      setIsLoading(true);
      await updateModuleLesson(dto);
      await fetchData();
    },
    [],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterLesson = useAsyncCallback(
    async (dto: IRegisterHubModuleLessonParams) => {
      setIsLoading(true);
      dto.lesson_type = `video`;
      await createModuleLesson(dto);
      await fetchData();
      setOpenLessonModal(false);
    },
    [],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveLesson = useAsyncCallback(
    async (mod: IHubModuleLesson) => {
      setIsLoading(true);
      await removeModuleLesson(mod.id);
      await fetchData();
    },
    [],
    false,
    () => setIsLoading(false),
  );

  const tableContent: Record<CoursePageViewType, React.ReactElement> = {
    course: (
      <CoursesTable
        dataSource={courses}
        permissions={permissions}
        fetchData={fetchData}
        handleCreate={handleRegisterCourse}
        handleUpdate={handleUpdateCourse}
        handleRemove={handleRemoveCourse}
        availableGrades={availableGrades}
        openRegisterModal={openCourseModal}
        setOpenRegisterModal={setOpenCourseModal}
        isLoading={isLoading}
      />
    ),
    module: (
      <ModulesTable
        dataSource={modules}
        courses={courses}
        fetchData={fetchData}
        handleCreate={handleRegisterModule}
        handleUpdate={handleUpdateModule}
        handleRemove={handleRemoveModule}
        openRegisterModal={openModuleModal}
        setOpenRegisterModal={setOpenModuleModal}
        isLoading={isLoading}
      />
    ),
    module_lesson: (
      <LessonsTable
        dataSource={lessons}
        modules={modules}
        videos={videos}
        fetchData={fetchData}
        handleCreate={handleRegisterLesson}
        handleUpdate={handleUpdateLesson}
        handleRemove={handleRemoveLesson}
        openRegisterModal={openLessonModal}
        setOpenRegisterModal={setOpenLessonModal}
        isLoading={isLoading}
      />
    ),
  };

  return (
    <Container>
      <Flex mb="1rem" justify="space-between">
        <TabSwitch
          tabs={coursePageViewOptions.map((view) => ({ key: view, label: coursePageViewLabelMapper[view], isSelected: pageView === view }))}
          onSwitch={(view) => setPageView(view as CoursePageViewType)}
        />
        <GenericButton
          size="sm"
          label={`Adicionar ${pageView === `course` ? `curso` : pageView === `module` ? `módulo` : `atividade`}`}
          btntype="outline-white"
          onClick={() =>
            pageView === `course` ? setOpenCourseModal(true) : pageView === `module` ? setOpenModuleModal(true) : setOpenLessonModal(true)
          }
        />
      </Flex>

      <Content>{tableContent[pageView]}</Content>
    </Container>
  );
};

export default Courses;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'courses';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return {
      props: {
        admin,
        selectedPage,
        pageTitle: 'Formações',
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
