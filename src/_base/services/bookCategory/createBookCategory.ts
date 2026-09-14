import { api } from '@/_base/classes/api';
import { IHubBookCategory, IRegisterHubBookCategoryParams } from '@/_base/interfaces/bookCategory';

export const createBookCategory = async (params: IRegisterHubBookCategoryParams): Promise<IHubBookCategory> => {
  const { data } = await api.post(`/book_category`, params);
  return data;
};
