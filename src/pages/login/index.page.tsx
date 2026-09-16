import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, Moon, Sun, User } from 'lucide-react';

import { useAsyncCallback, useAuth, useInputHandler, useLoading } from '@/_base/hooks';
import { useCustomRouter } from '@/_base/hooks/CustomRouter';
import { hubLogin } from '@/_base/services/auth';
import { logError, cookieManager } from '@/_base/utils';
import { AppReCaptcha } from '@/components/ReCaptcha';
import { IAuthRequest, authSchema } from '@/_base/interfaces/auth';
import { IReCAPTCHAData } from '@/_base/interfaces/auth/IReCaptchaData';
import { api } from '@/_base/classes/api';
import { getProfile } from '@/_base/services/user';
import { useShellTheme } from '@/components/Page/useShellTheme';
import { cn } from '@/lib/utils';

const LoginPage: React.FC = () => {
  const [submitLoading, setSubmitLoading] = useState(false);
  const [keepLogged, setKeepLogged] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState<IReCAPTCHAData>({ token: null });

  const { errors, onInputChange, data, submit } = useInputHandler<IAuthRequest>({ schema: authSchema });
  const { setLoadingConfig } = useLoading();
  const router = useCustomRouter();
  const { theme, toggle } = useShellTheme();

  const { setAdmin } = useAuth();

  const handleLogin = useAsyncCallback(
    async () => {
      setSubmitLoading(true);

      // Captcha temporarily disabled — domain issues in production. Re-enable by uncommenting this block and the <AppReCaptcha /> below.
      // if (!captcha.token) {
      //   setCaptcha((e) => ({ ...e, error: 'Captcha obrigatório' }));
      //   return;
      // } else setCaptcha((e) => ({ ...e, error: undefined }));

      const { admin, token: access_token } = await hubLogin({
        user: data.user,
        password: data.password,
      });

      cookieManager.setToken(access_token, keepLogged ? 15 : 1);
      api.defaults.headers.authorization = `Bearer ${access_token}`;
      setAdmin(admin);
      setLoadingConfig((cfg) => ({ ...cfg, isLoading: true, type: 'fullscreen-with-info' }));

      await new Promise((res) =>
        setTimeout(() => {
          router.push('/home');
          setTimeout(() => res(true), 15000);
        }, 2000),
      );
    },
    [router, captcha, keepLogged, data],
    false,
    () => setSubmitLoading(false),
  );

  return (
    <div className={cn('hub-cms-shell font-sans min-h-screen flex flex-col bg-background text-foreground', theme === 'dark' && 'dark')}>
      <div className="flex items-center justify-end px-4 sm:px-6 py-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="size-14 rounded-2xl bg-white ring-1 ring-border grid place-items-center shadow-sm p-2.5">
              <img src="/logo/pi-logo-dark.svg" alt="PiCode" className="w-full h-full object-contain" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">
              <span className="text-foreground">PiCode</span> <span className="text-muted-foreground font-normal">CMS</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Content Management System</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(handleLogin);
            }}
            className="rounded-xl border border-border bg-card text-card-foreground p-6 sm:p-7 shadow-sm space-y-5"
          >
            <div className="space-y-1.5">
              <label htmlFor="user" className="text-sm font-medium text-foreground">
                Usuário
              </label>
              <div className="relative">
                <User className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="user"
                  type="text"
                  autoComplete="username"
                  value={data?.user ?? ''}
                  onChange={(e) => onInputChange('user', e.target.value)}
                  placeholder="Nome de usuário"
                  className={cn(
                    'w-full h-11 rounded-md border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition',
                    errors.user ? 'border-destructive' : 'border-input',
                  )}
                />
              </div>
              {errors.user && <p className="text-xs text-destructive">{errors.user}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={data?.password ?? ''}
                  onChange={(e) => onInputChange('password', e.target.value)}
                  placeholder="Sua senha"
                  className={cn(
                    'w-full h-11 rounded-md border bg-background px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition',
                    errors.password ? 'border-destructive' : 'border-input',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="keep"
                type="checkbox"
                checked={keepLogged}
                onChange={(e) => setKeepLogged(e.target.checked)}
                className="size-4 rounded border-input accent-primary"
              />
              <label htmlFor="keep" className="text-sm text-muted-foreground select-none cursor-pointer">
                Manter-me conectado
              </label>
            </div>

            {/* Captcha temporarily disabled — domain issues in production. */}
            {/* <div className="flex justify-center pt-1">
              <AppReCaptcha onChange={(token) => setCaptcha({ token })} error={captcha?.error} />
            </div> */}

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} PiCode Education</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'login';

  try {
    cookieManager.updateToken(req);

    const user = await getProfile();

    return { redirect: { destination: '/home', user, permanent: false } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);

    return { props: { selectedPage, pageTitle: 'Login' } };
  }
};
