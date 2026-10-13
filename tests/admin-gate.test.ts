import { describe, expect, it } from 'vitest';
import { gateToken, safeAdminNext, sameToken, ADMIN_PATH_RE } from '@/lib/admin-gate';

describe('entrada oculta al panel', () => {
  it('solo redirige a rutas del panel', () => {
    expect(safeAdminNext('/admin/comandes/12')).toBe('/admin/comandes/12');
    expect(safeAdminNext('/admin/productes?ok=desat')).toBe('/admin/productes?ok=desat');
    for (const bad of ['//evil.com', 'https://evil.com', '/admin/../es', '/es', '/admin\\@evil', null, '/administrator']) {
      expect(safeAdminNext(bad)).toBe('/admin');
    }
  });
  it('la cookie depende del secreto y se compara exacta', async () => {
    const a = await gateToken('secreto-largo-de-prueba-123456');
    const b = await gateToken('otro-secreto-largo-de-prueba-99');
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
    expect(sameToken(a, a)).toBe(true);
    expect(sameToken(b, a)).toBe(false);
    expect(sameToken(undefined, a)).toBe(false);
  });
  it('exige direcciones largas', () => {
    expect(ADMIN_PATH_RE.test('admin')).toBe(false);
    expect(ADMIN_PATH_RE.test('0f3c9a2e-7d41-4b8e-9c55-1a2b3c4d5e6f')).toBe(true);
  });
});
