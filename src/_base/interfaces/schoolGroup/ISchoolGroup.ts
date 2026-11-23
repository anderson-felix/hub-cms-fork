import { IHubPermissionUsageLink } from '../permission';
import { IHubSchool } from '../school/ISchool';
import { IHubSchoolGroupMetadata } from './IHubSchoolGroupMetadata';

export interface IHubSchoolGroup {
  id: string;
  display_name: string;
  code: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  schools: IHubSchool[];
  usage_permission_links: IHubPermissionUsageLink[];
  metadata: IHubSchoolGroupMetadata;
}
