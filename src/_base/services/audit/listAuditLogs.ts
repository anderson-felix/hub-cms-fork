import { api } from '@/_base/classes/api';
import { IAuditLog, IListAuditLogsParams } from '@/_base/interfaces/audit';
import { IPagingResponse } from '@/_base/interfaces/shared';

export const listAuditLogs = async (params: IListAuditLogsParams = {}): Promise<IPagingResponse<IAuditLog>> => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  const { data } = await api.get('/audit/list', { params: { sort: 'created_at', order: 'DESC', ...clean } });
  return data;
};
