import { api } from '@/_base/classes/api';

export const removeBookCategory = async (id: string): Promise<void> => {
  await api.delete(`/book_category/${id}`);
};
