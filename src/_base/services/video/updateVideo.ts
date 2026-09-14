import { api } from '@/_base/classes/api';
import { IHubVideo, IUpdateHubVideoParams } from '@/_base/interfaces/video';

export const updateVideo = async ({ id, ...params }: IUpdateHubVideoParams): Promise<IHubVideo> => {
  const { data } = await api.patch(`/video/${id}`, params);
  return data;
};
