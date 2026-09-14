import { z } from 'zod';

import { zodSchemaErrors } from '@/_base/errors/zodSchemaErrors';
import { ZodCustomSchema } from '../zod';
import { IHubAdmin } from '../admin';

/** Interfaces and Types */
export interface IAuthRequest {
  user: string;
  password: string;
}

export interface IAuthResponse {
  token: string;
  admin: IHubAdmin;
}

/** Zod schemas */
export const authSchema: ZodCustomSchema<IAuthRequest> = z.object({
  user: z.string({ required_error: zodSchemaErrors.REQUIRED_FIELD }).trim().min(6, { message: zodSchemaErrors.MININUM_LENGTH }),
  password: z.string({ required_error: 'Campo obrigatório' }).min(6, { message: zodSchemaErrors.MININUM_LENGTH }),
});
