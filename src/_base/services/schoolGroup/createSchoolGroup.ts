import { api } from '@/_base/classes/api';
import { IHubSchoolGroup, IRegisterHubSchoolGroupParams } from '@/_base/interfaces/schoolGroup';

export const createSchoolGroup = async (params: IRegisterHubSchoolGroupParams): Promise<IHubSchoolGroup> => {
  const { data } = await api.post(`/school_group`, params);
  return data;
};
