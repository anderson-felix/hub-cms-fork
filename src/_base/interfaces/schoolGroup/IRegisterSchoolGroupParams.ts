import { z } from 'zod';

import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { IHubSchoolGroupMetadata } from './IHubSchoolGroupMetadata';

/** Interfaces and Types */
export interface IRegisterHubSchoolGroupParams {
  display_name: string;
  description: string | null;
  permissions?: string[];
  metadata?: IHubSchoolGroupMetadata;
}

export const EMPTY_SCHOOL_GROUP_DATA: IRegisterHubSchoolGroupParams = {
  display_name: ``,
  description: ``,
  metadata: { permission_restrictions: [] },
};

/** Zod schemas */
export const registerSchoolGroupSchema: ZodCustomSchema<IRegisterHubSchoolGroupParams> = z.object({
  display_name: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  permissions: z.any(),
  metadata: z.any(),
});
