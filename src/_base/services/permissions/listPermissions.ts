import { api } from '@/_base/classes/api';
import { IHubPermission } from '@/_base/interfaces/permission';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listPermissions = async (): Promise<IPagingResponse<IHubPermission>> => {
  const { data } = await api.get(`/permission/list?sort=created_at&order=DESC`);
  return data;
};
