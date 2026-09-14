import { IHubPermissionContentLink } from '../permission';
import { IProjectMetadata } from './IProjectMetadata';

export interface IHubProject {
  id: string;
  readable_id: number;
  title: string;
  book_id?: string;
  description: string | null;
  metadata: IProjectMetadata;
  grades: string[];
  created_at: Date;
  updated_at: Date;
  content_permission_links: IHubPermissionContentLink[];
}
