import { api } from '@/_base/classes/api';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IHubVideoCategory } from '@/_base/interfaces/videoCategory';

export const listVideoCategories = async (): Promise<IPagingResponse<IHubVideoCategory>> => {
  const { data } = await api.get(`/video_category/list?sort=created_at&order=DESC`);
  return data;
};
