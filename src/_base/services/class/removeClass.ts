import { api } from '@/_base/classes/api';

export const removeClass = async (id: string): Promise<void> => {
  await api.delete(`/class/${id}`);
};
