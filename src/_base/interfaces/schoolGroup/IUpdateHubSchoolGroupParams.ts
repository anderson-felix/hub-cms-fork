
import { IRegisterHubSchoolGroupParams } from './IRegisterSchoolGroupParams';

export interface IUpdateHubSchoolGroupParams extends Partial<IRegisterHubSchoolGroupParams> {
  id: string;
}

