import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import {
  createPaymentForm,
  decodeParameters,
  deriveKey,
  isValidDsOrder,
  newDsOrder,
  sign,
  verifyNotification
} from '../lib/redsys';

// Comercio de pruebas público de Redsys.
const KEY = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';
const cfg = { merchantCode: '999008881', terminal: '1', secretKey: KEY, url: 'https://sis-t.redsys.es:25443/sis/realizarPago' };

/** Implementación independiente con el binario de OpenSSL, para no validar el código contra sí mismo. */
function opensslDerive(keyB64: string, order: string): Buffer {
  const keyHex = Buffer.from(keyB64, 'base64').toString('hex');
  const data = Buffer.from(order, 'utf8');
  const padded = Buffer.alloc(Math.ceil(data.length / 8) * 8, 0);
  data.copy(padded);
  return execFileSync('openssl', ['enc', '-des-ede3-cbc', '-K', keyHex, '-iv', '0000000000000000', '-nopad'], {
    input: padded
  });
}

function hasOpenssl(): boolean {
  try {
    execFileSync('openssl', ['version']);
    return true;
  } catch {
    return false;
  }
}

describe('firma Redsys', () => {
  it.runIf(hasOpenssl())('la clave diversificada coincide con OpenSSL (3DES-CBC, IV a ceros)', () => {
    for (const order of ['1234ABCD', '123456789101', '0001', '4821K7Q2MZ0A']) {
      expect(deriveKey(KEY, order).toString('hex')).toBe(opensslDerive(KEY, order).toString('hex'));
    }
  });

  it.runIf(hasOpenssl())('la firma es HMAC-SHA256 de los parámetros con la clave diversificada', () => {
    const mp = Buffer.from(JSON.stringify({ DS_MERCHANT_AMOUNT: '999' })).toString('base64');
    const expected = createHmac('sha256', opensslDerive(KEY, '1234ABCD')).update(mp).digest('base64');
    expect(sign(KEY, '1234ABCD', mp)).toBe(expected);
  });

  it('genera los campos del formulario con importe en céntimos y EUR', () => {
    const form = createPaymentForm(cfg, {
      dsOrder: '1234ABCD',
      amountCents: 2490,
      merchantUrl: 'https://tienda.test/api/redsys/notify',
      urlOk: 'https://tienda.test/es/pedido/x?r=ok',
      urlKo: 'https://tienda.test/es/pedido/x?r=ko',
      lang: 'ca'
    });
    expect(form.fields.Ds_SignatureVersion).toBe('HMAC_SHA256_V1');
    const params = JSON.parse(Buffer.from(form.fields.Ds_MerchantParameters, 'base64').toString());
    expect(params).toMatchObject({
      DS_MERCHANT_AMOUNT: '2490',
      DS_MERCHANT_ORDER: '1234ABCD',
      DS_MERCHANT_CURRENCY: '978',
      DS_MERCHANT_TRANSACTIONTYPE: '0',
      DS_MERCHANT_MERCHANTCODE: '999008881',
      DS_MERCHANT_TERMINAL: '1',
      DS_MERCHANT_CONSUMERLANGUAGE: '003'
    });
    expect(form.fields.Ds_Signature).toBe(sign(KEY, '1234ABCD', form.fields.Ds_MerchantParameters));
  });

  it('rechaza importes no enteros o nulos', () => {
    const base = { dsOrder: '1234ABCD', merchantUrl: 'x', urlOk: 'x', urlKo: 'x' };
    expect(() => createPaymentForm(cfg, { ...base, amountCents: 0 })).toThrow();
    expect(() => createPaymentForm(cfg, { ...base, amountCents: 9.99 })).toThrow();
  });

  it('los números de operación cumplen el formato de Redsys y no se repiten', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i += 1) {
      const o = newDsOrder();
      expect(o).toHaveLength(12);
      expect(isValidDsOrder(o)).toBe(true);
      seen.add(o);
    }
    expect(seen.size).toBe(500);
  });
});

/** Simula lo que envía Redsys: parámetros en base64 y firma en base64 URL-safe. */
function fakeNotification(params: Record<string, string>, key = KEY) {
  const mp = Buffer.from(JSON.stringify(params)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  const sig = sign(key, params.Ds_Order, mp).replace(/\+/g, '-').replace(/\//g, '_');
  return { Ds_SignatureVersion: 'HMAC_SHA256_V1', Ds_MerchantParameters: mp, Ds_Signature: sig };
}

describe('notificación Redsys', () => {
  const ok = {
    Ds_Date: '07%2F10%2F2026',
    Ds_Hour: '15%3A12',
    Ds_Amount: '2490',
    Ds_Currency: '978',
    Ds_Order: '1234ABCD',
    Ds_MerchantCode: '999008881',
    Ds_Terminal: '1',
    Ds_Response: '0000',
    Ds_AuthorisationCode: '123456',
    Ds_TransactionType: '0'
  };

  it('acepta una notificación firmada y la marca como autorizada', () => {
    const n = verifyNotification(KEY, fakeNotification(ok));
    expect(n).toMatchObject({ dsOrder: '1234ABCD', amountCents: 2490, authorized: true, authCode: '123456' });
    expect(n.params.Ds_Date).toBe('07/10/2026');
  });

  it('una respuesta 0190 (denegada) no está autorizada', () => {
    expect(verifyNotification(KEY, fakeNotification({ ...ok, Ds_Response: '0190' })).authorized).toBe(false);
  });

  it('rechaza una firma manipulada', () => {
    const n = fakeNotification(ok);
    const tampered = { ...n, Ds_MerchantParameters: fakeNotification({ ...ok, Ds_Amount: '1' }).Ds_MerchantParameters };
    expect(() => verifyNotification(KEY, tampered)).toThrow(/Firma/);
  });

  it('rechaza una notificación firmada con otra clave', () => {
    const otherKey = Buffer.alloc(24, 7).toString('base64');
    expect(() => verifyNotification(KEY, fakeNotification(ok, otherKey))).toThrow(/Firma/);
  });

  it('decodifica parámetros en base64 URL-safe', () => {
    expect(decodeParameters(fakeNotification(ok).Ds_MerchantParameters).Ds_Order).toBe('1234ABCD');
  });
});
