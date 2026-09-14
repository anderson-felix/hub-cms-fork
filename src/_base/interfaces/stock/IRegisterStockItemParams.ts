import { z } from 'zod';

import { ZodCustomSchema } from '../zod';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { IStoreMakerItemMetadata } from './IStoreMakerItemMetadata';

/** Interfaces and Types */
export interface IRegisterStockItemParams {
  name: string;
  description?: string | null;
  picture: string;
  video_url?: string | null;
  price: string;
  permissions?: string[];
  reusable?: boolean;
  metadata?: IStoreMakerItemMetadata;
}

export interface IUpdateStockItemParams extends Partial<IRegisterStockItemParams> {
  id: string;
}

export const EMPTY_STOCK_ITEM_DATA: IRegisterStockItemParams = {
  name: ``,
  description: ``,
  picture: ``,
  video_url: null,
  price: ``,
  permissions: [],
  reusable: false,
  metadata: { is_service: false },
};

/** Zod schemas */
export const registerStockItemSchema: ZodCustomSchema<IRegisterStockItemParams> = z.object({
  name: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  permissions: z.any(),
  picture: z.string(),
  video_url: z.string().optional(),
  price: z.string().trim(),
  reusable: z.boolean().optional(),
  metadata: z.any(),
});
