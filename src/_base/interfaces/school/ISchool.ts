import { IHubClass } from '../class';
import { IHubSchoolGroup } from '../schoolGroup';

/** Interfaces and Types */
export interface IHubSchool {
  id: string;
  hub_school_group_id: string;
  display_name: string;
  description: string | null;
  code: string;
  created_at: Date;
  updated_at: Date;
  school_group: IHubSchoolGroup;
  classes: IHubClass[];
}
export interface IHubUserSchool {
  id: string;
  hub_school_group_id: string | null;
  display_name: string;
  description: string | null;
  approved_at: Date | null;
}
