import { api } from '@/_base/classes/api';
import { IHubCourse, IUpdateHubCourseParams } from '@/_base/interfaces/course';

export const updateCourse = async ({ id, ...params }: IUpdateHubCourseParams): Promise<IHubCourse> => {
  const { data } = await api.patch(`/course/${id}`, params);
  return data;
};
