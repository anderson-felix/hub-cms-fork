import 'moment/locale/pt-br';
import '@/styles/tailwind.css';
import { ChakraProvider, CSSReset } from '@chakra-ui/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from 'styled-components';
import type { AppProps } from 'next/app';

import { api } from '@/_base/classes/api';
import { CustomRouterProvider } from '@/_base/hooks/CustomRouter';
import { LoadingProvider } from '@/_base/hooks/Loading';
import { Page } from '@/_base/hooks/Page';
import { cookieManager } from '@/_base/utils';
import { globalTheme } from '@/styles/global';
import { light as theme } from '../styles/colors';
import { ConfigProvider, theme as antTheme } from 'antd';

export default function App({ Component, pageProps }: AppProps) {
  const token = cookieManager.getToken();
  api.defaults.headers.authorization = `Bearer ${token}`;
  antTheme.defaultConfig.token.fontFamily = `'Inter' - sans-serif`;
  return (
    <GoogleOAuthProvider clientId="47490597990-gfmoh1pha85b9qi3b19fg3t75ebb0rm2.apps.googleusercontent.com">
      <ChakraProvider theme={globalTheme}>
        <ThemeProvider theme={theme}>
          <ConfigProvider theme={{ token: antTheme.defaultConfig.token }}>
            <LoadingProvider changeSignal={{}}>
              <CustomRouterProvider>
                <Page {...pageProps}>
                  <Component {...pageProps} />
                  <CSSReset />
                </Page>
              </CustomRouterProvider>
            </LoadingProvider>
          </ConfigProvider>
        </ThemeProvider>
      </ChakraProvider>
    </GoogleOAuthProvider>
  );
}
