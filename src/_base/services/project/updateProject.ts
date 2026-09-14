import { api } from '@/_base/classes/api';
import { IHubProject } from '@/_base/interfaces/project';
import { IUpdateProjectParams } from '@/_base/interfaces/project';

export const updateProject = async ({ id, ...params }: IUpdateProjectParams): Promise<IHubProject> => {
  const { data } = await api.patch(`/project/${id}`, params);
  return data;
};
