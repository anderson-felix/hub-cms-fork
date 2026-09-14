import { IHubPermissionContentLink } from './IHubPermissionContentLink';
import { IHubPermissionUsageLink } from './IHubPermissionUsageLink';

export interface IHubPermission {
  id: string;
  title: string;
  description: string;
  metadata: IHubPermissionMetadata;
  created_at: Date;
  updated_at: Date;
  usage_links: IHubPermissionUsageLink[];
  content_links: IHubPermissionContentLink[];
}

export interface IHubPermissionMetadata {}
