import { api } from '@/_base/classes/api';

/**
 * Blocks (or unblocks) login for every student of this class.
 * `disabled: true` restricts access, `disabled: false` releases it.
 */
export const restrictClassAccess = async (id: string, disabled: boolean): Promise<void> => {
  await api.put(`/class/restrict_access/${id}`, { disabled });
};
