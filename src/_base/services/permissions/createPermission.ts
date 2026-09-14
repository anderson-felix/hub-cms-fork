import { api } from '@/_base/classes/api';
import { IHubPermission, IRegisterHubPermissionParams } from '@/_base/interfaces/permission';

export const createPermission = async (params: IRegisterHubPermissionParams): Promise<IHubPermission> => {
  const { data } = await api.post(`/permission`, params);
  return data;
};
