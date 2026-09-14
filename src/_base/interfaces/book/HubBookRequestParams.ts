import { z } from 'zod';

import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { ZodCustomSchema } from '../zod';
import { IBookMetadata } from './IHubBookMetadata';

export interface IRegisterHubBookParams {
  category_id: string;
  title: string;
  description?: string;
  grades: string[];
  thumbnail?: string;
  file: string;
  permissions?: string[];
  metadata?: IBookMetadata;
}

export interface IUpdateHubBookParams extends Partial<Omit<IRegisterHubBookParams, `grades` | `category_id`>> {
  id: string;
}

/** Zod schemas */
export const hubBookSchema: ZodCustomSchema<IRegisterHubBookParams> = z.object({
  category_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }),
  title: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  grades: z.array(z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim()).nonempty({ message: zodSchemaErrors.REQUIRED_FIELD }),
  thumbnail: z.string().trim().optional(),
  metadata: z
    .object({
      rewards: z.array(
        z.object({
          activity: z.string(),
          reward_value: z.string(),
          reward_type: z.string().optional(),
        }),
      ),
    })
    .optional(),
  file: z.string().trim().optional(),
  permissions: z.any(),
});

export const EMPTY_BOOK_SCHEMA_DATA: IRegisterHubBookParams = {
  category_id: ``,
  title: ``,
  description: ``,
  grades: [],
  metadata: { rewards: [] },
  thumbnail: ``,
  file: ``,
};
