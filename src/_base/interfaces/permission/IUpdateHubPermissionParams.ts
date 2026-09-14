import { IRegisterHubPermissionParams } from './IRegisterHubPermissionParams';

export interface IUpdateHubPermissionParams extends Partial<IRegisterHubPermissionParams> {
  id: string;
}
