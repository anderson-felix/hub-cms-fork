import { api } from '@/_base/classes/api';
import { IHubSchoolGroup, IUpdateHubSchoolGroupParams } from '@/_base/interfaces/schoolGroup';

export const updateSchoolGroup = async ({ id, ...params }: IUpdateHubSchoolGroupParams): Promise<IHubSchoolGroup> => {
  const { data } = await api.patch(`/school_group/${id}`, params);
  return data;
};
