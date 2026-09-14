import { ICertificateTemplate } from '../certificate';
import { IHubModule } from '../module';
import { IHubPermissionContentLink } from '../permission';
import { HubContentScope } from '../shared/HubContentScope';

export interface IHubCourse {
  id: string;
  readable_id: number;
  dependency_id: string | null;
  scope: HubContentScope;
  title: string;
  description: string | null;
  grades: string[];
  certificate_templates: ICertificateTemplate[];
  has_certificate: boolean;
  thumbnail: string | null;
  created_at: Date;
  updated_at: Date;
  dependency: IHubCourse | null;
  modules: IHubModule[];
  content_permission_links: IHubPermissionContentLink[];
}
