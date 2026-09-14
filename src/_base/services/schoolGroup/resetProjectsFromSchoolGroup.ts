import { api } from '@/_base/classes/api';

export const resetProjectsFromSchoolGroup = async (id: string): Promise<void> => {
  await api.put(`/school_group/clear_picode_projects/${id}`);
};
