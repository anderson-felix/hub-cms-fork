import { z } from 'zod';
import { ZodCustomSchema } from '../zod';
import { HubModuleLessonType } from './HubModuleLessonType';
import { IHubModuleLessonMetadata } from './IHubModuleLessonMetadata';
import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';

/** Interfaces and Types */
export interface IRegisterHubModuleLessonParams {
  module_id: string;
  video_id?: string | null;
  book_id?: string | null;
  title: string;
  description?: string | null;
  position: number;
  lesson_type: HubModuleLessonType;
  metadata: IHubModuleLessonMetadata;
}

export interface IUpdateHubModuleLessonParams extends Partial<Omit<IRegisterHubModuleLessonParams, `module_id` | `lesson_type`>> {
  id: string;
}

/** Zod schemas */
export const hubModuleLessonSchema: ZodCustomSchema<IRegisterHubModuleLessonParams> = z.object({
  module_id: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).uuid(),
  video_id: z.string().uuid().optional(),
  book_id: z.string().uuid().optional(),
  title: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  description: z.string().trim().optional(),
  // position: z.number({ required_error: zodSchemaErrors.REQUIRED_FIELD }).min(1, `Valor minimo: 1`),
  position: z.any().optional(),
  // lesson_type: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim(),
  lesson_type: z.any().optional(),
  metadata: z.any().optional(),
});
