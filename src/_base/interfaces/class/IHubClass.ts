import { IHubProject } from '../project';
import { IHubSchool } from '../school';
import { IHubUser } from '../user';

export interface IHubClass {
  id: string;
  hub_school_id: string;
  display_name: string;
  description: string | null;
  code: string;
  grade: string;
  students: IHubUser[];
  projects: IHubProject[];
  hub_school: IHubSchool;
}

export interface ISimpleHubClass {
  name: string;
  grade: string;
}
