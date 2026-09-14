import { IHubPermissionContentLink } from '../permission';
import { IStoreMakerItemMetadata } from './IStoreMakerItemMetadata';

export interface IStockItem {
  id: string;
  name: string;
  description: string | null;
  picture: string;
  video_url: string | null;
  price: string;
  reusable?: boolean;
  metadata?: IStoreMakerItemMetadata;
  created_at: Date;
  updated_at: Date;
  stock_schools: any[];
  content_permission_links: IHubPermissionContentLink[];
}
