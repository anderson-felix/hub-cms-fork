import { api } from '@/_base/classes/api';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IHubVideo } from '@/_base/interfaces/video';

export const listVideos = async (): Promise<IPagingResponse<IHubVideo>> => {
  const { data } = await api.get(`/video/list?sort=created_at&order=DESC`);
  return data;
};
