import { api } from '@/_base/classes/api';

export const removeCourse = async (id: string): Promise<void> => {
  await api.delete(`/course/${id}`);
};
