import { api } from '@/_base/classes/api';
import { IHubModuleLesson } from '@/_base/interfaces/moduleLesson';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listModuleLessons = async (): Promise<IPagingResponse<IHubModuleLesson>> => {
  const { data } = await api.get(`/module_lesson/list?sort=created_at&order=DESC`);
  return data;
};
