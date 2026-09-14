import { api } from '@/_base/classes/api';

export const removeVideoCategory = async (id: string): Promise<void> => {
  await api.delete(`/video_category/${id}`);
};
