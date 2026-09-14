import { api } from '@/_base/classes/api';
import { IHubCourse, IRegisterHubCourseParams } from '@/_base/interfaces/course';

export const createCourse = async (params: IRegisterHubCourseParams): Promise<IHubCourse> => {
  const { data } = await api.post(`/course`, params);
  return data;
};
