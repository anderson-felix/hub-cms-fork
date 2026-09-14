import { api } from '@/_base/classes/api';
import { IHubClass, IRegisterHubClassParams } from '@/_base/interfaces/class';

export const createClass = async (params: IRegisterHubClassParams): Promise<IHubClass> => {
  const { data } = await api.post(`/class`, params);
  return data;
};
