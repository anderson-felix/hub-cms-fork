import { IHubProjectStep } from './IHubProjectStep';

export interface IProjectMetadata {
  steps?: IHubProjectStep[];
  presentation?: string;
  thumbnail?: string;
  bncc?: string[];
  tools?: string[];
  attachments?: string[];
}
