import { api } from '@/_base/classes/api';
import { IHubSchool, IUpdateHubSchoolParams } from '@/_base/interfaces/school';

export const updateSchool = async ({ id, ...params }: IUpdateHubSchoolParams): Promise<IHubSchool> => {
  const { data } = await api.patch(`/school/${id}`, params);
  return data;
};
