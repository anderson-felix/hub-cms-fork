import { api } from '@/_base/classes/api';

/**
 * Blocks (or unblocks) login for every student and teacher of every school in this network.
 * `disabled: true` restricts access, `disabled: false` releases it.
 */
export const restrictSchoolGroupAccess = async (id: string, disabled: boolean): Promise<void> => {
  await api.put(`/school_group/restrict_access/${id}`, { disabled });
};
