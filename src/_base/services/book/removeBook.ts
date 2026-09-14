import { api } from '@/_base/classes/api';

export const removeBook = async (id: string): Promise<void> => {
  await api.delete(`/book/${id}`);
};
