import { api } from '@/_base/classes/api';
import { IHubUser, IUpdateTeacherSchoolLinkParams } from '@/_base/interfaces/user';

/**
 * Links or unlinks a school (within the teacher's own network) to/from a teacher's account.
 * TODO: placeholder endpoint — confirm the real route with the backend once it exists.
 */
export const updateTeacherSchoolLink = async (params: IUpdateTeacherSchoolLinkParams): Promise<IHubUser> => {
  const { data } = await api.post('/user/school_link', params);
  return data;
};
