import { api } from '@/_base/classes/api';
import { IHubVideo, IRegisterHubVideoParams } from '@/_base/interfaces/video';

export const createVideo = async (params: IRegisterHubVideoParams): Promise<IHubVideo> => {
  const { data } = await api.post(`/video`, params);
  return data;
};
