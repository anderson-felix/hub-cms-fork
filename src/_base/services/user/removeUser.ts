import { api } from '@/_base/classes/api';

export const removeUser = async (userId: string): Promise<void> => {
  await api.delete(`/user/${userId}`);
};
