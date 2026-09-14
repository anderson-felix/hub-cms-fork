import { z } from 'zod';

import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { HubContentScope } from '../shared';
import { ZodCustomSchema } from '../zod';

export interface IRegisterHubVideoCategoryParams {
  display_name: string;
  scope: HubContentScope | null;
}

export interface IUpdateHubVideoCategoryParams extends Partial<Omit<IRegisterHubVideoCategoryParams, `scope`>> {
  id: string;
}

/** Zod schemas */
export const hubVideoCategorySchema: ZodCustomSchema<IRegisterHubVideoCategoryParams> = z.object({
  display_name: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  scope: z.string().trim().optional().nullable(),
});

export const EMPTY_VIDEO_CATEGORY_SCHEMA_DATA: IRegisterHubVideoCategoryParams = {
  display_name: ``,
  scope: `` as any,
};
