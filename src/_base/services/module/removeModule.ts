import { api } from '@/_base/classes/api';

export const removeModule = async (id: string): Promise<void> => {
  await api.delete(`/module/${id}`);
};
