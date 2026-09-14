import { api } from '@/_base/classes/api';

export const removeProject = async (id: string): Promise<void> => {
  await api.delete(`/project/${id}`);
};
