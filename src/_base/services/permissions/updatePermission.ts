import { api } from '@/_base/classes/api';
import { IHubPermission } from '@/_base/interfaces/permission';
import { IUpdateHubPermissionParams } from '@/_base/interfaces/permission/IUpdateHubPermissionParams';

export const updatePermission = async ({ id, ...params }: IUpdateHubPermissionParams): Promise<IHubPermission> => {
  const { data } = await api.patch(`/permission/${id}`, params);
  return data;
};
