import { api } from '@/_base/classes/api';

export const resetProjectsFromClass = async (id: string): Promise<void> => {
  await api.put(`/project/clear_factory_projects/class/${id}`);
};
