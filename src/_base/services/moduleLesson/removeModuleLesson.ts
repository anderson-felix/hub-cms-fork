import { api } from '@/_base/classes/api';

export const removeModuleLesson = async (id: string): Promise<void> => {
  await api.delete(`/module_lesson/${id}`);
};
