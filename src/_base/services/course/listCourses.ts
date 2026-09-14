import { api } from '@/_base/classes/api';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IHubCourse } from '@/_base/interfaces/course';

export const listCourses = async (): Promise<IPagingResponse<IHubCourse>> => {
  const { data } = await api.get(`/course/list?sort=created_at&order=DESC`);
  return data;
};
