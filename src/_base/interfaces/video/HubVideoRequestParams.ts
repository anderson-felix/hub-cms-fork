import { z } from 'zod';

import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { ZodCustomSchema } from '../zod';

export interface IRegisterHubVideoParams {
  category_id: string;
  title: string;
  description?: string;
  grades: string[];
  thumbnail?: string;
  file: string;
  permissions?: string[];
}

export interface IUpdateHubVideoParams extends Partial<Omit<IRegisterHubVideoParams, `grades` | `category_id`>> {
  id: string;
}

/** Zod schemas */
export const hubVideoSchema: ZodCustomSchema<IRegisterHubVideoParams> = z.object({
  category_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }),
  title: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  grades: z.array(z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim()).nonempty({ message: zodSchemaErrors.REQUIRED_FIELD }),
  thumbnail: z.string().trim().optional(),
  file: z.string().trim().optional(),
  permissions: z.any(),
});

export const EMPTY_VIDEO_SCHEMA_DATA: IRegisterHubVideoParams = {
  category_id: ``,
  title: ``,
  description: ``,
  grades: [],
  thumbnail: ``,
  file: ``,
};
