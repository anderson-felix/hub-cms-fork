import { api } from '@/_base/classes/api';
import { IRedefinePassword } from '@/_base/interfaces/shared/IRedefinePassword';

export const resetSchoolPassword = async (id: string, config: IRedefinePassword): Promise<void> => {
  await api.put(`/school/reset_password/${id}`, config);
};
