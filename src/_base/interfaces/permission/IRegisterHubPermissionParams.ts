import { z } from 'zod';

import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';

/** Interfaces and Types */
export interface IRegisterHubPermissionParams {
  title: string;
  description: string | null;
}

export const EMPTY_PERMISSION_DATA: IRegisterHubPermissionParams = {
  title: ``,
  description: ``,
};

/** Zod schemas */
export const registerPermissionSchema: ZodCustomSchema<IRegisterHubPermissionParams> = z.object({
  title: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
});
