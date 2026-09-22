
import { IRegisterHubSchoolGroupParams } from './IRegisterSchoolGroupParams';

export interface IUpdateHubSchoolGroupParams extends Partial<IRegisterHubSchoolGroupParams> {
  id: string;
  access_suspended?: boolean;
  suspension_reason?: string | null;
}

