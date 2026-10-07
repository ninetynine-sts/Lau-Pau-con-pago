import 'server-only';
import { db, schema } from './db';

export type StoreSettings = {
  storeEmail: string;
  notifyEmail: string;
  instagram: string;
  paymentLinkDays: number;
  shippingReviewed: boolean;
};

const DEFAULTS: StoreSettings = {
  storeEmail: 'comercial@exitekta.ad',
  notifyEmail: 'comercial@exitekta.ad',
  instagram: 'lau.and.pau',
  paymentLinkDays: 7,
  shippingReviewed: false
};

export async function getSettings(): Promise<StoreSettings> {
  const rows = await db.select().from(schema.settings);
  const out: Record<string, unknown> = { ...DEFAULTS };
  for (const r of rows) out[r.key] = r.value;
  return out as StoreSettings;
}

export async function saveSettings(patch: Partial<StoreSettings>): Promise<void> {
  for (const [key, value] of Object.entries(patch)) {
    await db
      .insert(schema.settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
}
