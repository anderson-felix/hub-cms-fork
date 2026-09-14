import { api } from '@/_base/classes/api';
import { IHubBook, IUpdateHubBookParams } from '@/_base/interfaces/book';

export const updateBook = async ({ id, ...params }: IUpdateHubBookParams): Promise<IHubBook> => {
  const { data } = await api.patch(`/book/${id}`, params);
  return data;
};
