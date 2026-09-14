import { api } from '@/_base/classes/api';
import { IHubVideoCategory, IUpdateHubVideoCategoryParams } from '@/_base/interfaces/videoCategory';

export const updateVideoCategory = async ({ id, ...params }: IUpdateHubVideoCategoryParams): Promise<IHubVideoCategory> => {
  const { data } = await api.patch(`/video_category/${id}`, params);
  return data;
};
