import { api } from '@/_base/classes/api';
import { IHubUser, IUpdateStudentClassParams } from '@/_base/interfaces/user';

/**
 * Moves a student to a different class, optionally in a different school within the same network.
 * TODO: placeholder endpoint — confirm the real route with the backend once it exists.
 */
export const changeStudentClass = async (params: IUpdateStudentClassParams): Promise<IHubUser> => {
  const { data } = await api.post('/user/change_class', params);
  return data;
};
