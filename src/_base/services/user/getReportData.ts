import { api } from '@/_base/classes/api';
import { IHubBook } from '@/_base/interfaces/book';
import { IHubClass } from '@/_base/interfaces/class';
import { IHubCourse } from '@/_base/interfaces/course';
import { IHubPermission } from '@/_base/interfaces/permission';
import { IHubSchool } from '@/_base/interfaces/school';
import { IHubSchoolGroup } from '@/_base/interfaces/schoolGroup';
import { IPagingResponse } from '@/_base/interfaces/shared';
import { IHubUser } from '@/_base/interfaces/user';
import { IHubVideo } from '@/_base/interfaces/video';

export interface IReportDataResponse {
  users: IPagingResponse<IHubUser>;
  classes: IPagingResponse<IHubClass>;
  schools: IPagingResponse<IHubSchool>;
  school_groups: IPagingResponse<IHubSchoolGroup>;
  books: IPagingResponse<IHubBook>;
  videos: IPagingResponse<IHubVideo>;
  courses: IPagingResponse<IHubCourse>;
  permissions: IPagingResponse<IHubPermission>;
}

export const getReportData = async (): Promise<IReportDataResponse> => {
  const { data } = await api.get(`/report_data`);
  return data;
};
