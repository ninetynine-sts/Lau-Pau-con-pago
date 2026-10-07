import { redirect } from 'next/navigation';
import { isLang, path } from '@/lib/routes';
import { getUser } from '@/lib/auth';

export default async function AccountIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const L = isLang(lang) ? lang : 'es';
  const user = await getUser();
  redirect(user ? path(L, 'cuenta', 'pedidos') : path(L, 'cuenta', 'acceder'));
}
