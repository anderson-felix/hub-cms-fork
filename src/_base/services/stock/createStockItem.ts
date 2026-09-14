import { api } from '@/_base/classes/api';
import { IRegisterStockItemParams, IStockItem } from '@/_base/interfaces/stock';

export const createStockItem = async (params: IRegisterStockItemParams): Promise<IStockItem> => {
  const { data } = await api.post(`/store_maker/item`, params);
  return data;
};
