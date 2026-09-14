import { api } from '@/_base/classes/api';
import { IHubModule, IUpdateHubModuleParams } from '@/_base/interfaces/module';

export const updateModule = async ({ id, ...params }: IUpdateHubModuleParams): Promise<IHubModule> => {
  const { data } = await api.patch(`/module/${id}`, params);
  return data;
};
