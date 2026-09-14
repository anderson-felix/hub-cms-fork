import { api } from '@/_base/classes/api';
import { IHubModuleLesson } from '@/_base/interfaces/moduleLesson';
import { IUpdateHubModuleLessonParams } from '@/_base/interfaces/moduleLesson/IHubModuleLessonRequestParams';

export const updateModuleLesson = async ({ id, ...params }: IUpdateHubModuleLessonParams): Promise<IHubModuleLesson> => {
  const { data } = await api.patch(`/module_lesson/${id}`, params);
  return data;
};
