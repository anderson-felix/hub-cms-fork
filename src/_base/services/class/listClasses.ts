import { api } from '@/_base/classes/api';
import { IHubClass } from '@/_base/interfaces/class';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listClasses = async (): Promise<IPagingResponse<IHubClass>> => {
  const { data } = await api.get(`/class/list?sort=created_at&order=DESC`);
  return data;
};
