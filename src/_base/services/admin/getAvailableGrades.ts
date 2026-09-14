import { api } from '@/_base/classes/api';

export const getAvailableGrades = async (): Promise<string[]> => {
  const { data } = await api.get(`/available_grades`);
  return data;
};
