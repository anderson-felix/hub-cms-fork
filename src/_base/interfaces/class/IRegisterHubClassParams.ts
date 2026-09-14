import { z } from 'zod';

import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';

/** Interfaces and Types */

export interface IRegisterHubClassParams {
  hub_school_id: string;
  display_name: string;
  description: string | null;
  grade: string;
}

export interface IUpdateHubClassParams extends Omit<Partial<IRegisterHubClassParams>, `grades` | `hub_school_id`> {
  id: string;
}

/** Zod schemas */
export const registerClassSchema: ZodCustomSchema<IRegisterHubClassParams> = z.object({
  hub_school_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  display_name: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  grade: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }),
});
