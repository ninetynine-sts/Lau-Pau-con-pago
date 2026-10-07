import type { Metadata } from 'next';
import '../styles/laupau.css';
import '../styles/shop.css';
import '../styles/admin.css';

export const metadata: Metadata = {
  title: { default: 'Tauler · Lau&Pau', template: '%s · Tauler Lau&Pau' },
  robots: { index: false, follow: false },
  icons: { icon: '/laupau/marca/logo-final.png' }
};

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <body className="lp-admin">{children}</body>
    </html>
  );
}
