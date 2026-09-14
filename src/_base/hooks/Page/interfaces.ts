import { IHubAdmin } from '@/_base/interfaces/admin';

export interface IPageProps {
  user?: IHubAdmin;
  selectedPage?: string;
  pageTitle?: string;
  headerLabel?: string;
  showBackButton?: boolean;
  isOpen: boolean;
  stopTour: () => void;
}
