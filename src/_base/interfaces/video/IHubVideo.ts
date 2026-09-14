import { IHubModuleLesson } from '../moduleLesson';
import { IHubPermissionContentLink } from '../permission';
import { IHubVideoCategory } from '../videoCategory';

export interface IHubVideo {
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
  category: IHubVideoCategory;
  lessons: IHubModuleLesson[];
  content_permission_links: IHubPermissionContentLink[];
}
