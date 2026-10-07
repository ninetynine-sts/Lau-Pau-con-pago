/**
 * Redsys · TPV Virtual por redirección, firma HMAC_SHA256_V1.
 *
 * Flujo:
 *  1. El servidor genera los parámetros del pago y su firma (createPaymentForm).
 *  2. El navegador los envía por POST a Redsys, donde la persona paga.
 *  3. Redsys avisa al servidor (notificación online, servidor a servidor). Ahí, y solo
 *     ahí, se verifica la firma (verifyNotification) y se da el pedido por pagado.
 *
 * Firma: la clave secreta (base64) se diversifica cifrando el número de pedido con
 * 3DES-CBC (IV a ceros, relleno con ceros) y con esa clave se calcula el HMAC-SHA256
 * de la cadena Ds_MerchantParameters tal cual, en base64.
 */
import { createCipheriv, createHmac, randomInt, timingSafeEqual } from 'node:crypto';

export const SIGNATURE_VERSION = 'HMAC_SHA256_V1';
export const CURRENCY_EUR = '978';

/** Códigos de idioma de la página de pago de Redsys. */
export const REDSYS_LANG = { es: '001', ca: '003' } as const;

export type RedsysConfig = {
  merchantCode: string;
  terminal: string;
  secretKey: string; // base64, tal como la entrega el banco
  url: string;
};

export type PaymentRequest = {
  dsOrder: string;
  amountCents: number;
  merchantUrl: string; // notificación online
  urlOk: string;
  urlKo: string;
  lang?: keyof typeof REDSYS_LANG;
  description?: string;
  titular?: string;
};

export type RedsysForm = {
  url: string;
  fields: { Ds_SignatureVersion: string; Ds_MerchantParameters: string; Ds_Signature: string };
};

/** Clave diversificada por pedido. */
export function deriveKey(secretKeyB64: string, dsOrder: string): Buffer {
  const key = Buffer.from(secretKeyB64, 'base64');
  if (key.length !== 24) throw new Error('La clave de Redsys debe ser de 24 bytes (base64).');
  const data = Buffer.from(dsOrder, 'utf8');
  const padded = Buffer.alloc(Math.ceil(data.length / 8) * 8, 0);
  data.copy(padded);
  const cipher = createCipheriv('des-ede3-cbc', key, Buffer.alloc(8, 0));
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(padded), cipher.final()]);
}

export function sign(secretKeyB64: string, dsOrder: string, merchantParametersB64: string): string {
  return createHmac('sha256', deriveKey(secretKeyB64, dsOrder)).update(merchantParametersB64).digest('base64');
}

/** Redsys devuelve la firma en base64 «URL-safe». Se normaliza antes de comparar. */
function normalizeB64(s: string): string {
  return s.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
}

export function signaturesMatch(a: string, b: string): boolean {
  const x = Buffer.from(normalizeB64(a));
  const y = Buffer.from(normalizeB64(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Número de operación: 12 caracteres, los 4 primeros numéricos, único por intento.
 * Ej.: 4821K7Q2MZ0A. Redsys rechaza un número ya usado aunque el pago fallara.
 */
export function newDsOrder(): string {
  const digits = String(randomInt(0, 10000)).padStart(4, '0');
  const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rest = '';
  for (let i = 0; i < 8; i += 1) rest += alphabet[randomInt(0, alphabet.length)];
  return digits + rest;
}

export function isValidDsOrder(s: string): boolean {
  return /^[0-9]{4}[0-9A-Za-z]{0,8}$/.test(s);
}

export function createPaymentForm(cfg: RedsysConfig, req: PaymentRequest): RedsysForm {
  if (!Number.isSafeInteger(req.amountCents) || req.amountCents <= 0) throw new Error('Importe inválido.');
  if (!isValidDsOrder(req.dsOrder)) throw new Error('Número de pedido Redsys inválido.');

  const params: Record<string, string> = {
    DS_MERCHANT_AMOUNT: String(req.amountCents),
    DS_MERCHANT_ORDER: req.dsOrder,
    DS_MERCHANT_MERCHANTCODE: cfg.merchantCode,
    DS_MERCHANT_CURRENCY: CURRENCY_EUR,
    DS_MERCHANT_TRANSACTIONTYPE: '0', // autorización
    DS_MERCHANT_TERMINAL: cfg.terminal,
    DS_MERCHANT_MERCHANTURL: req.merchantUrl,
    DS_MERCHANT_URLOK: req.urlOk,
    DS_MERCHANT_URLKO: req.urlKo
  };
  if (req.lang) params.DS_MERCHANT_CONSUMERLANGUAGE = REDSYS_LANG[req.lang];
  if (req.description) params.DS_MERCHANT_PRODUCTDESCRIPTION = req.description.slice(0, 125);
  if (req.titular) params.DS_MERCHANT_TITULAR = req.titular.slice(0, 60);

  const merchantParameters = Buffer.from(JSON.stringify(params), 'utf8').toString('base64');
  return {
    url: cfg.url,
    fields: {
      Ds_SignatureVersion: SIGNATURE_VERSION,
      Ds_MerchantParameters: merchantParameters,
      Ds_Signature: sign(cfg.secretKey, req.dsOrder, merchantParameters)
    }
  };
}

export type RedsysNotification = {
  dsOrder: string;
  amountCents: number;
  responseCode: number;
  authorized: boolean;
  authCode?: string;
  params: Record<string, string>;
};

/** Decodifica Ds_MerchantParameters (base64 normal o URL-safe). */
export function decodeParameters(merchantParametersB64: string): Record<string, string> {
  const json = Buffer.from(normalizeB64(merchantParametersB64), 'base64').toString('utf8');
  const raw = JSON.parse(json) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    // Redsys codifica algunos valores (fecha, hora) como URL.
    const s = String(v ?? '');
    try {
      out[k] = decodeURIComponent(s);
    } catch {
      out[k] = s;
    }
  }
  return out;
}

function pick(params: Record<string, string>, name: string): string | undefined {
  const key = Object.keys(params).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? params[key] : undefined;
}

/**
 * Verifica la notificación online. Lanza si la firma no cuadra: en ese caso el
 * mensaje no viene de Redsys y no debe tocar ningún pedido.
 */
export function verifyNotification(
  secretKeyB64: string,
  body: { Ds_SignatureVersion?: string; Ds_MerchantParameters?: string; Ds_Signature?: string }
): RedsysNotification {
  const mp = body.Ds_MerchantParameters;
  const signature = body.Ds_Signature;
  if (!mp || !signature) throw new Error('Notificación incompleta.');
  if (body.Ds_SignatureVersion && body.Ds_SignatureVersion !== SIGNATURE_VERSION) {
    throw new Error('Versión de firma no soportada.');
  }

  const params = decodeParameters(mp);
  const dsOrder = pick(params, 'Ds_Order');
  if (!dsOrder || !isValidDsOrder(dsOrder)) throw new Error('Notificación sin número de pedido válido.');

  const expected = sign(secretKeyB64, dsOrder, mp);
  if (!signaturesMatch(expected, signature)) throw new Error('Firma de Redsys no válida.');

  const responseCode = Number.parseInt(pick(params, 'Ds_Response') ?? '9999', 10);
  const amountCents = Number.parseInt(pick(params, 'Ds_Amount') ?? '0', 10);
  return {
    dsOrder,
    amountCents,
    responseCode,
    // 0000–0099: operación autorizada.
    authorized: Number.isFinite(responseCode) && responseCode >= 0 && responseCode <= 99,
    authCode: pick(params, 'Ds_AuthorisationCode')?.trim() || undefined,
    params
  };
}
