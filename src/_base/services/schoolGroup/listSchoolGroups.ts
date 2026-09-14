import { api } from '@/_base/classes/api';
import { IHubSchoolGroup } from '@/_base/interfaces/schoolGroup';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listSchoolGroups = async (): Promise<IPagingResponse<IHubSchoolGroup>> => {
  const { data } = await api.get(`/school_group/list?sort=created_at&order=DESC`);
  return data;
};
