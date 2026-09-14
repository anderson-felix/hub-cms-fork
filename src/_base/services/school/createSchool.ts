import { api } from '@/_base/classes/api';
import { IHubSchool, IRegisterHubSchoolParams } from '@/_base/interfaces/school';

export const createSchool = async (params: IRegisterHubSchoolParams): Promise<IHubSchool> => {
  const { data } = await api.post(`/school`, params);
  return data;
};
