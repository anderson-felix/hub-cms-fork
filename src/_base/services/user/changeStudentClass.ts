import { api } from '@/_base/classes/api';
import { IHubUser, IUpdateStudentClassParams } from '@/_base/interfaces/user';

/**
 * Moves a student to a different class, optionally in a different school within the same network.
 */
export const changeStudentClass = async (params: IUpdateStudentClassParams): Promise<IHubUser> => {
  const { data } = await api.put('/user/change_school_group', params);
  return data;
};
