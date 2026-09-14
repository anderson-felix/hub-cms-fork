import { z } from 'zod';

import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';

/** Interfaces and Types */
export interface IUpdateHubSchoolParams {
  id: string;
  display_name: string;
  description: string | null;
}

/** Zod schemas */
export const updateSchoolSchema: ZodCustomSchema<IUpdateHubSchoolParams> = z.object({
  id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  display_name: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
});
