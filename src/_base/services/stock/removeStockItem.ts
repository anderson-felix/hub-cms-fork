import { api } from '@/_base/classes/api';

export const removeStockItem = async (id: string): Promise<void> => {
  await api.delete(`/store_maker/item/${id}`);
};
