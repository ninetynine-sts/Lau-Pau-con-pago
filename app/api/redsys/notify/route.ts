import { NextResponse } from 'next/server';
import { handleRedsysNotification } from '@/lib/orders';

/**
 * Notificación online de Redsys (servidor a servidor). Es lo único que da un pedido
 * por pagado. Llega como application/x-www-form-urlencoded.
 */
export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try {
    const type = req.headers.get('content-type') ?? '';
    if (type.includes('application/json')) body = (await req.json()) as Record<string, string>;
    else body = Object.fromEntries(new URLSearchParams(await req.text())) as Record<string, string>;
  } catch {
    return new NextResponse('Bad request', { status: 400 });
  }

  try {
    const result = await handleRedsysNotification(body);
    console.log(`[redsys] notificación: ${result.status}${'orderId' in result ? ` · pedido ${result.orderId}` : ''}`);
    return new NextResponse('OK', { status: 200 });
  } catch (e) {
    // Firma inválida o datos corruptos: no viene de Redsys, no se toca nada.
    console.warn('[redsys] notificación rechazada:', e instanceof Error ? e.message : e);
    return new NextResponse('Invalid', { status: 400 });
  }
}

export function GET() {
  return new NextResponse('Method not allowed', { status: 405 });
}
