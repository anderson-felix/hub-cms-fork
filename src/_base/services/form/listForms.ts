import { api } from '@/_base/classes/api';
import { IHubForm } from '@/_base/interfaces/form';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listForms = async (): Promise<IPagingResponse<IHubForm>> => {
  const { data } = await api.get('/form/list?sort=created_at&order=DESC');
  return data;
};
