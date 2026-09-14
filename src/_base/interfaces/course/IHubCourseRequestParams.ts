import { z } from 'zod';

import { HubContentScope } from '../shared';
import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { ICertificateTemplate } from '../certificate';

/** Interfaces and Types */
export interface IRegisterHubCourseParams {
  dependency_id?: string;
  scope: HubContentScope;
  title: string;
  description?: string;
  grades: string[];
  thumbnail?: string;
  permissions?: string[];
  certificate_templates: ICertificateTemplate[];
}

export interface IUpdateHubCourseParams extends Omit<Partial<IRegisterHubCourseParams>, `grades` | `scope`> {
  id: string;
}

/** Zod schemas */
export const hubCourseSchema: ZodCustomSchema<IRegisterHubCourseParams> = z.object({
  dependency_id: z.string().uuid().optional(),
  scope: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  title: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  grades: z.array(z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD })).nonempty(),
  thumbnail: z.string().trim().optional(),
  permissions: z.any(),
  certificate_templates: z.any(),
});

export const EMPTY_COURSE_SCHEMA_DATA: IRegisterHubCourseParams = {
  dependency_id: ``,
  scope: `` as any,
  title: ``,
  description: undefined,
  grades: [],
  certificate_templates: [],
  thumbnail: undefined,
};
