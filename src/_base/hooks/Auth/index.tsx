import { IHubAdmin } from '@/_base/interfaces/admin';
import { create } from 'zustand';

type UseAuthHookType = { admin: IHubAdmin; setAdmin: (admin: IHubAdmin) => void };

export const useAuth = create<UseAuthHookType>((set) => ({
  admin: {} as IHubAdmin,
  setAdmin: (data: IHubAdmin) => set(() => ({ admin: data })),
}));
