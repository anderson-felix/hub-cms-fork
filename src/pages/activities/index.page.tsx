import { GetServerSideProps } from 'next';

import { logError, cookieManager } from '@/_base/utils';
import { Flex } from '@chakra-ui/react';
import { IHubUser } from '@/_base/interfaces/user';

interface IProps {
  user: IHubUser;
}

const Activities: React.FC<IProps> = () => {
  return (
    <Flex w="100%" direction="column" overflow="auto" gap="24px">
      <Flex direction="row" flex="1" gap="24px">
        <Flex bgColor="bggray" w="100%" h="100px" border="1px" borderColor="gray300" borderRadius="10px" padding="20px" color="white">
          Atividades
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Activities;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'activities';

  try {
    cookieManager.updateToken(req);

    // const user = await validateSession();

    return { props: { selectedPage, pageTitle: 'Atividades', showBackButton: false } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);

    return { redirect: { destination: '/login', permanent: false } };
  }
};
