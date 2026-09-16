export type TeacherSchoolLinkAction = 'add' | 'remove';

export interface IUpdateTeacherSchoolLinkParams {
  hub_user_id: string;
  hub_school_group_id: string;
  hub_school_id: string;
  action: TeacherSchoolLinkAction;
}
