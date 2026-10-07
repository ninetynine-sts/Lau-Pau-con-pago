import { navigate, useHashPath } from './router';
import { bump } from '../mock/store';

export function usePathname(): string {
  return useHashPath();
}

export function useRouter() {
  return {
    push: (to: string) => navigate(to),
    replace: (to: string) => navigate(to, { replace: true }),
    refresh: () => bump(),
    back: () => history.back(),
    prefetch: () => {}
  };
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function notFound(): never {
  throw new Error('NOT_FOUND');
}

export function redirect(to: string): never {
  navigate(to, { replace: true });
  throw new Error('REDIRECT');
}
