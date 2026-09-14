import { z } from 'zod';

import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';

/** Interfaces and Types */
export interface IRegisterHubModuleParams {
  dependency_id?: string | null;
  hub_course_id: string;
  title: string;
  position: number;
  description?: string | null;
}

export interface IUpdateHubModuleParams extends Partial<Omit<IRegisterHubModuleParams, `hub_course_id` | `dependency_id`>> {
  id: string;
}

/** Zod schemas */
export const hubModuleSchema: ZodCustomSchema<IRegisterHubModuleParams> = z.object({
  dependency_id: z.string().uuid().optional(),
  hub_course_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  title: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  position: z.number().min(0),
});

export const EMPTY_HUB_MODULE: IRegisterHubModuleParams = {
  hub_course_id: ``,
  title: ``,
  position: 1,
};
