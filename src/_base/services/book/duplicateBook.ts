import { api } from '@/_base/classes/api';

export const duplicateBook = async (id: string): Promise<void> => {
  await api.put(`/book/duplicate/${id}`);
};
