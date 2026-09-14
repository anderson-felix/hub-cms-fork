import { api } from '@/_base/classes/api';
import { IHubBookCategory, IUpdateHubBookCategoryParams } from '@/_base/interfaces/bookCategory';

export const updateBookCategory = async ({ id, ...params }: IUpdateHubBookCategoryParams): Promise<IHubBookCategory> => {
  const { data } = await api.patch(`/book_category/${id}`, params);
  return data;
};
