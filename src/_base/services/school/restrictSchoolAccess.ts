import { api } from '@/_base/classes/api';

/**
 * Blocks (or unblocks) login for every student and teacher of this school.
 * `disabled: true` restricts access, `disabled: false` releases it.
 */
export const restrictSchoolAccess = async (id: string, disabled: boolean): Promise<void> => {
  await api.put(`/school/restrict_access/${id}`, { disabled });
};
