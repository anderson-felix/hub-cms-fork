import { api } from '@/_base/classes/api';

export const removePermission = async (id: string): Promise<void> => {
  await api.delete(`/permission/${id}`);
};
