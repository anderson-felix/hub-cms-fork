import { api } from '@/_base/classes/api';
import { IHubForm, IRegisterHubFormParams } from '@/_base/interfaces/form';

export const createForm = async (params: IRegisterHubFormParams): Promise<IHubForm> => {
  const { data } = await api.post('/form', params);
  return data;
};
