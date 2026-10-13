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

  uploadDir: opt('UPLOAD_DIR') ?? './uploads',

  /** Dirección secreta de entrada al panel (ver lib/admin-gate.ts). */
  adminPath: opt('ADMIN_PATH')?.toLowerCase()
};

/** Enlace al panel para correos: pasa por la entrada secreta si está configurada. */
export function adminUrl(path: string): string {
  return env.adminPath
    ? `${env.siteUrl}/${env.adminPath}?next=${encodeURIComponent(path)}`
    : `${env.siteUrl}${path}`;
}

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
  // En Hostinger cada despliegue vacía los archivos de la app: sin base de datos externa se
  // perderían pedidos y clientes, y sin R2 las fotos subidas desde el panel.
  if (!env.databaseUrl) throw new Error('[config] Falta DATABASE_URL (Neon u otro PostgreSQL). Sin ella los datos se borrarían en cada despliegue.');
  const r2Ready = Boolean(env.r2.accountId && env.r2.accessKeyId && env.r2.secretAccessKey && env.r2.bucket && env.r2.publicUrl);
  if (!r2Ready && !opt('UPLOAD_DIR')?.startsWith('/')) {
    throw new Error('[config] Faltan las variables R2_* (fotos del panel). Sin R2 las fotos subidas se perderían al redesplegar. (Solo en un servidor propio: UPLOAD_DIR con ruta absoluta y persistente.)');
  }
  if (!env.adminPath || !/^[a-z0-9-]{24,64}$/.test(env.adminPath)) {
    throw new Error(
      '[config] Falta ADMIN_PATH (o no es válida): la entrada secreta al panel. Usa entre 24 y 64 letras minúsculas, números o guiones, p. ej. el resultado de «node -e "console.log(crypto.randomUUID())"».'
    );
  }
  if (!env.siteUrl.startsWith('https://') && !/^http:\/\/localhost(:\d+)?$/.test(env.siteUrl)) throw new Error('[config] SITE_URL debe empezar por https:// en producción.');
}
