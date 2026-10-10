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

/*
 * Comprobaciones al arrancar en producción (no durante «next build» ni en la demo del navegador).
 * La clave de pruebas de Redsys es pública: con ella cualquiera podría firmar un aviso de
 * «pago correcto». Por eso el servidor no arranca si se usaría en producción sin quererlo.
 */
const runtimeProd = isProd && typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build';
if (runtimeProd) {
  const allowTest = opt('REDSYS_ALLOW_TEST') === '1';
  const missing = ['REDSYS_MERCHANT_CODE', 'REDSYS_TERMINAL', 'REDSYS_SECRET_KEY'].filter((k) => !opt(k));
  const publicKey = env.redsys.secretKey === REDSYS_TEST_DEFAULTS.secretKey;
  if ((missing.length || publicKey || env.redsys.env !== 'production') && !allowTest) {
    throw new Error(
      `[config] Redsys no está listo para cobrar de verdad (${
        missing.length ? `faltan ${missing.join(', ')}` : publicKey ? 'se usa la clave pública de pruebas' : 'REDSYS_ENV no es production'
      }). Configura las credenciales del banco o, solo para un entorno de pruebas, REDSYS_ALLOW_TEST=1.`
    );
  }
  if (!env.siteUrl.startsWith('https://') && !/^http:\/\/localhost(:\d+)?$/.test(env.siteUrl)) throw new Error('[config] SITE_URL debe empezar por https:// en producción.');
}
