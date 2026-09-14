import { z } from 'zod';

import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { HubContentScope } from '../shared';
import { ZodCustomSchema } from '../zod';

export interface IRegisterHubBookCategoryParams {
  display_name: string;
  scope: HubContentScope | null;
}

export interface IUpdateHubBookCategoryParams extends Partial<Omit<IRegisterHubBookCategoryParams, `scope`>> {
  id: string;
}

/** Zod schemas */
export const hubBookCategorySchema: ZodCustomSchema<IRegisterHubBookCategoryParams> = z.object({
  display_name: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  scope: z.string().trim().optional().nullable(),
});

export const EMPTY_BOOK_CATEGORY_SCHEMA_DATA: IRegisterHubBookCategoryParams = {
  display_name: ``,
  scope: `` as any,
};
