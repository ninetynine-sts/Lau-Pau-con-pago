/**
 * Configuración leída de variables de entorno. Solo servidor.
 * La lista completa, con explicación, está en .env.example.
 */
import 'server-only';

function opt(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : undefined;
}

const isProd = process.env.NODE_ENV === 'production';

/** Comercio de pruebas público de Redsys. Solo se usa si no hay credenciales del banco. */
const REDSYS_TEST_DEFAULTS = {
  merchantCode: '999008881',
  terminal: '1',
  secretKey: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'
};

const redsysEnv = (opt('REDSYS_ENV') ?? 'test') as 'test' | 'production';

export const env = {
  isProd,
  siteUrl: (opt('SITE_URL') ?? 'http://localhost:3000').replace(/\/+$/, ''),
  databaseUrl: opt('DATABASE_URL'),

  redsys: {
    env: redsysEnv,
    merchantCode: opt('REDSYS_MERCHANT_CODE') ?? REDSYS_TEST_DEFAULTS.merchantCode,
    terminal: opt('REDSYS_TERMINAL') ?? REDSYS_TEST_DEFAULTS.terminal,
    secretKey: opt('REDSYS_SECRET_KEY') ?? REDSYS_TEST_DEFAULTS.secretKey,
    usingTestDefaults: !opt('REDSYS_SECRET_KEY'),
    url:
      opt('REDSYS_URL') ??
      (redsysEnv === 'production'
        ? 'https://sis.redsys.es/sis/realizarPago'
        : 'https://sis-t.redsys.es:25443/sis/realizarPago')
  },

  mail: {
    resendKey: opt('RESEND_API_KEY'),
    from: opt('MAIL_FROM') ?? 'Lau&Pau <hola@example.com>',
    replyTo: opt('MAIL_REPLY_TO')
  },

  r2: {
    accountId: opt('R2_ACCOUNT_ID'),
    accessKeyId: opt('R2_ACCESS_KEY_ID'),
    secretAccessKey: opt('R2_SECRET_ACCESS_KEY'),
    bucket: opt('R2_BUCKET'),
    publicUrl: opt('R2_PUBLIC_URL')?.replace(/\/+$/, '')
  },

  uploadDir: opt('UPLOAD_DIR') ?? './uploads'
};

if (isProd && env.redsys.env === 'production' && env.redsys.usingTestDefaults) {
  throw new Error('REDSYS_ENV=production exige REDSYS_MERCHANT_CODE, REDSYS_TERMINAL y REDSYS_SECRET_KEY.');
}
