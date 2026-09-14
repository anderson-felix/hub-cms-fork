import { api } from '@/_base/classes/api';

export const removeSchool = async (id: string): Promise<void> => {
  await api.delete(`/school/${id}`);
};
