import { api } from '@/_base/classes/api';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IHubUser } from '@/_base/interfaces/user';

export const listUsers = async (): Promise<IPagingResponse<IHubUser>> => {
  const { data } = await api.get(`/user/list?sort=created_at&order=DESC`);
  return data;
};
