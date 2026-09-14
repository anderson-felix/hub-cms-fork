import { api } from '@/_base/classes/api';
import { IHubClass, IUpdateHubClassParams } from '@/_base/interfaces/class';

export const updateClass = async ({ id, ...params }: IUpdateHubClassParams): Promise<IHubClass> => {
  const { data } = await api.patch(`/class/${id}`, params);
  return data;
};
