import { IHubBook } from '../book';
import { IHubCourse } from '../course';
import { IHubVideo } from '../video';
import { IHubPermission } from './IHubPermission';

export interface IHubPermissionContentLink {
  id: string;
  hub_permission_id: string;
  hub_book_id: string | null;
  hub_video_id: string | null;
  hub_course_id: string | null;
  hub_project_id: string | null;
  store_maker_item_id: string | null;
  permission: IHubPermission;
  hub_book: IHubBook;
  hub_video: IHubVideo;
  hub_course: IHubCourse;
  hub_project: any;
  store_maker_item: any;
}
