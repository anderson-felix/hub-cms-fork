import Head from 'next/head';
import { PropsWithChildren, createContext, useContext } from 'react';

import { PageWrapper } from '@/components/Page';
import { IPageProps } from './interfaces';
import { useAuth } from '../Auth';
import { Tour } from 'antd';
import { useHubTour } from '../HubTour';

const PageContext = createContext({});
export const usePageContext = () => useContext(PageContext);

export const Page: React.FC<PropsWithChildren<IPageProps>> = ({ children, pageTitle, selectedPage, showBackButton, headerLabel }) => {
  const { admin: user } = useAuth();
  const { isOpen, steps, stopTour, navbar } = useHubTour();

  return (
    <PageContext.Provider value={{}}>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <PageWrapper
        user={user}
        selectedPage={selectedPage}
        showBackButton={showBackButton}
        headerLabel={headerLabel}
        isOpen={navbar.isOpen}
        stopTour={navbar.stopTour}
      >
        {children}
      </PageWrapper>
      <Tour open={isOpen} onClose={() => stopTour()} steps={steps} />
    </PageContext.Provider>
  );
};
