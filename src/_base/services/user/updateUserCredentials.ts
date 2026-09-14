import { api } from '@/_base/classes/api';
import { IHubUser } from '@/_base/interfaces/user';
import IUpdateUserCredentials from '@/_base/interfaces/user/IUpdateProfile';

export const updateUserCredentials = async (params: IUpdateUserCredentials): Promise<IHubUser> => {
  const { data } = await api.patch('/user/update_credentials', params);
  return data;
};
