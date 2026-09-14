import { api } from '@/_base/classes/api';
import { IHubBookCategory } from '@/_base/interfaces/bookCategory';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listBookCategories = async (): Promise<IPagingResponse<IHubBookCategory>> => {
  const { data } = await api.get(`/book_category/list?sort=created_at&order=DESC`);
  return data;
};
