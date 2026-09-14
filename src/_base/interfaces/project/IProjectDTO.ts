import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { IProjectMetadata } from './IProjectMetadata';
import { ZodCustomSchema } from '../zod';
import { z } from 'zod';

export interface IRegisterProjectParams {
  title: string;
  grades: string[];
  book_id?: string;
  description?: string | null;
  metadata: IProjectMetadata;
  permissions: string[];
}

export interface IUpdateProjectParams extends Partial<IRegisterProjectParams> {
  id: string;
}

export const EMPTY_PROJECT_DATA: IRegisterProjectParams = {
  title: '',
  description: null,
  metadata: {},
  grades: [],
  permissions: [],
};

export const hubProjectSchema: ZodCustomSchema<IRegisterProjectParams> = z.object({
  title: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  book_id: z.string().uuid().optional(),
  grades: z.array(z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD })).nonempty(),
  permissions: z.any(),
  metadata: z.any(),
});
