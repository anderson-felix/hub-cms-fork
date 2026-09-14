import { api } from '@/_base/classes/api';
import { IHubSchool } from '@/_base/interfaces/school';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listSchools = async (): Promise<IPagingResponse<IHubSchool>> => {
  const { data } = await api.get(`/school/list?sort=created_at&order=DESC`);
  return data;
};
