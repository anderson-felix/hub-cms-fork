import { z } from 'zod';

import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { ISimpleHubClass } from '../class';

/** Interfaces and Types */
export interface IRegisterHubSchoolParams {
  hub_school_group_id: string;
  display_name: string;
  description: string | null;
  classes?: ISimpleHubClass[];
}

export const EMPTY_SCHOOL_DATA: IRegisterHubSchoolParams = {
  hub_school_group_id: ``,
  display_name: ``,
  description: ``,
};

/** Zod schemas */
export const registerSchoolSchema: ZodCustomSchema<IRegisterHubSchoolParams> = z.object({
  hub_school_group_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  display_name: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  classes: z.any(),
});
