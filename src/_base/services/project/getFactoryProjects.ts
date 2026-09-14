import { api } from '@/_base/classes/api';
import { IHubProject } from '@/_base/interfaces/project';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const getFactoryProjects = async (): Promise<IPagingResponse<IHubProject>> => {
  const { data } = await api.get(`/project/list?sort=created_at&order=DESC`);

  return data;
};
