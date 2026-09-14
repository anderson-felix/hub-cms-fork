import { HubAdminRole } from './HubAdminRole';

export interface IHubAdmin {
  id: string;
  name: string;
  username: string;
  email: string;
  role: HubAdminRole;
}
