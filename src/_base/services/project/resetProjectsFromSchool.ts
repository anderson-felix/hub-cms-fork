import { api } from '@/_base/classes/api';

export const resetProjectsFromSchool = async (id: string): Promise<void> => {
  await api.put(`/project/clear_factory_projects/school/${id}`);
};
