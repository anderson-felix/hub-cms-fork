import { IHubAdmin } from '@/_base/interfaces/admin';

export interface INavbarProps {
  page: string;
  user?: IHubAdmin;
  isOpen: boolean;
  stopTour: () => void;
  onNavigate?: () => void;
}
