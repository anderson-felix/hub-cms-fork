import { IHubModuleLesson } from '../moduleLesson';
import { IHubBookCategory } from '../bookCategory';
import { IHubPermissionContentLink } from '../permission';
import { IBookMetadata } from './IHubBookMetadata';

export interface IHubBook {
  id: string;
  readable_id: number;
  category_id: string;
  title: string;
  description: string | null;
  grades: string[];
  thumbnail: string;
  file: string;
  created_at: Date;
  updated_at: Date;
  category: IHubBookCategory;
  lessons: IHubModuleLesson[];
  content_permission_links: IHubPermissionContentLink[];
  metadata: IBookMetadata;
}
