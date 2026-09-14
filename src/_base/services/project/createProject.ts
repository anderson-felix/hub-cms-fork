import { api } from '@/_base/classes/api';
import { IHubProject } from '@/_base/interfaces/project';
import { IRegisterProjectParams } from '@/_base/interfaces/project';

export const createProject = async (params: IRegisterProjectParams): Promise<IHubProject> => {
  const { data } = await api.post(`/project`, params);
  return data;
};
