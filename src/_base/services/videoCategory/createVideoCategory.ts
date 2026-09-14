import { api } from '@/_base/classes/api';
import { IHubVideoCategory, IRegisterHubVideoCategoryParams } from '@/_base/interfaces/videoCategory';

export const createVideoCategory = async (params: IRegisterHubVideoCategoryParams): Promise<IHubVideoCategory> => {
  const { data } = await api.post(`/video_category`, params);
  return data;
};
