export interface IUpdateTeacherSchoolLinkParams {
  hub_user_id: string;
  hub_school_group_id: string;
  /** First selected school. */
  hub_school_id: string;
  /** Remaining selected schools (always sent, even when empty). */
  extra_schools: string[];
}
