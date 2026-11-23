import { api } from '@/_base/classes/api';
import { IHubModuleLesson } from '@/_base/interfaces/moduleLesson';
import { IRegisterHubModuleLessonParams } from '@/_base/interfaces/moduleLesson/IHubModuleLessonRequestParams';

export const createModuleLesson = async ({ metadata, ...params }: IRegisterHubModuleLessonParams): Promise<IHubModuleLesson> => {
  // The backend rejects `metadata` on creation ("metadata" is not allowed), so it is only sent when there is
  // something in it. An empty `{}` used to be sent on every request and caused a 400.
  const hasMetadata = !!metadata && Object.keys(metadata).length > 0;
  const { data } = await api.post(`/module_lesson`, hasMetadata ? { ...params, metadata } : params);
  return data;
};
