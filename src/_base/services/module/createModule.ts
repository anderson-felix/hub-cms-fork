import { api } from '@/_base/classes/api';
import { IHubModule, IRegisterHubModuleParams } from '@/_base/interfaces/module';

export const createModule = async (params: IRegisterHubModuleParams): Promise<IHubModule> => {
  const { data } = await api.post(`/module`, params);
  return data;
};
