import { api } from '@/_base/classes/api';
import { IHubUser, IUpdateTeacherSchoolLinkParams } from '@/_base/interfaces/user';

/**
 * Links school(s) (within the teacher's own network) to a teacher's account.
 * Uses the same route as the student class change, with hub_class_id null (teachers have no class).
 * The first selected school goes in hub_school_id and the rest go in extra_schools.
 */
export const updateTeacherSchoolLink = async (params: IUpdateTeacherSchoolLinkParams): Promise<IHubUser> => {
  const { data } = await api.put('/user/change_school_group', { ...params, hub_class_id: null });
  return data;
};
