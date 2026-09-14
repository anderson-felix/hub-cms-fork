import { api } from '@/_base/classes/api';

export const removeVideo = async (id: string): Promise<void> => {
  await api.delete(`/video/${id}`);
};
