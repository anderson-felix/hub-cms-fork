import { api } from '@/_base/classes/api';
import { IHubModuleLesson } from '@/_base/interfaces/moduleLesson';
import { IRegisterHubModuleLessonParams } from '@/_base/interfaces/moduleLesson/IHubModuleLessonRequestParams';

export const createModuleLesson = async (params: IRegisterHubModuleLessonParams): Promise<IHubModuleLesson> => {
  const { data } = await api.post(`/module_lesson`, params);
  return data;
};
