import { api } from '@/_base/classes/api';
import { IStockItem, IUpdateStockItemParams } from '@/_base/interfaces/stock';

export const updateStockItem = async ({ id, ...params }: IUpdateStockItemParams): Promise<IStockItem> => {
  const { data } = await api.patch(`/store_maker/item/${id}`, params);
  return data;
};
