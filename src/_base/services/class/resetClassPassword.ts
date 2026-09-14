import { api } from '@/_base/classes/api';
import { IRedefinePassword } from '@/_base/interfaces/shared/IRedefinePassword';

export const resetClassPassword = async (id: string, config: IRedefinePassword): Promise<void> => {
  await api.put(`/class/reset_password/${id}`, config);
};
