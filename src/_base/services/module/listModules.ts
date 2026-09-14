import { api } from '@/_base/classes/api';
import { IHubModule } from '@/_base/interfaces/module';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listModules = async (): Promise<IPagingResponse<IHubModule>> => {
  const { data } = await api.get(`/module/list?sort=created_at&order=DESC`);
  return data;
};
