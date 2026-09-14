import { api } from '@/_base/classes/api';
import { IHubBook, IRegisterHubBookParams } from '@/_base/interfaces/book';

export const createBook = async (params: IRegisterHubBookParams): Promise<IHubBook> => {
  const { data } = await api.post(`/book`, params);
  return data;
};
