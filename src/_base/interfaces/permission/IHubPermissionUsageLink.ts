import { IHubSchoolGroup } from '../schoolGroup';
import { IHubPermission } from './IHubPermission';

export interface IHubPermissionUsageLink {
  id: string;
  hub_permission_id: string;
  hub_school_group_id: string;
  metadata: IHubPermissionUsageLinkMetadata;
  created_at: Date;
  updated_at: Date;
  permission: IHubPermission;
  hub_school_group: IHubSchoolGroup;
}

export interface IHubPermissionUsageLinkMetadata {}
