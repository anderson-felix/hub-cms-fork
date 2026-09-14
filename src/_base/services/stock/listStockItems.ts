import { api } from '@/_base/classes/api';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IStockItem } from '@/_base/interfaces/stock';

export const listStockItems = async (): Promise<IPagingResponse<IStockItem>> => {
  const { data } = await api.get(`/store_maker/item/list?sort=created_at&order=DESC`);
  return data;
};
