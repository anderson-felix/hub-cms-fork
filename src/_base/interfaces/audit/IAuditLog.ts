export type AuditTargetType = 'user' | 'school' | 'school_group' | 'class' | 'permission' | 'book' | 'video' | 'course' | 'project' | 'stock' | string;

export interface IAuditLog {
  id: string;
  created_at: string;
  /** Admin who performed the action. Null if the admin was deleted. */
  admin: { id: string; name: string; email: string } | null;
  /** Machine-readable action, e.g. `school.restrict_access`, `user.change_school_group`. */
  action: string;
  target_type: AuditTargetType;
  target_id: string | null;
  /** Display name of the target at the time of the action (snapshot, survives deletion). */
  target_label: string | null;
  method: string;
  route: string;
  status_code: number;
  /** Request body, with sensitive fields already redacted by the backend. */
  payload: Record<string, unknown> | null;
  /** Optional before/after snapshot of the changed fields. */
  changes?: { before: Record<string, unknown> | null; after: Record<string, unknown> | null } | null;
  ip?: string | null;
}

export interface IListAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  target_type?: string;
  target_id?: string;
  admin_id?: string;
  /** ISO date (yyyy-mm-dd), inclusive. */
  from?: string;
  /** ISO date (yyyy-mm-dd), inclusive. */
  to?: string;
}
