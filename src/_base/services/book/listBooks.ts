import { api } from '@/_base/classes/api';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IHubBook } from '@/_base/interfaces/book';

export const listBooks = async (): Promise<IPagingResponse<IHubBook>> => {
  const { data } = await api.get(`/book/list?sort=created_at&order=DESC`);

  return data;
};
