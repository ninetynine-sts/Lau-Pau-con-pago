# Lau&Pau · Tienda online

Tienda de Lau&Pau con el diseño de la web original, en castellano y catalán, con pago por
tarjeta mediante **Redsys** (TPV Virtual de banco andorrano), área de cliente y panel de
administración en catalán.

- **Web pública** (`/es`, `/ca`): portada, catálogo con filtros, fichas, cesta, compra,
  páginas legales y área de cliente (pedidos, solicitudes, direcciones, datos, recuperar contraseña).
- **Productos normales**: cesta → envío y cupón → pago con Redsys.
- **Productos personalizables** (charm con letra, manta): la clienta envía una solicitud;
  en el panel se fija el precio final y se le envía por correo un enlace de pago que caduca.
- **Panel** (`/admin`): inicio con avisos, comandes, sol·licituds, productes (fotos, models,
  estoc), enviaments, cupons y configuració (correos y personas con acceso).

Stack: Next.js 15 · React 19 · PostgreSQL con Drizzle ORM · Resend · Cloudflare R2.

---

## Cómo funciona el pago

1. Al pagar, el servidor crea el pedido como *pendiente de pago* y firma los parámetros
   (HMAC-SHA256 con clave diversificada 3DES por pedido, `lib/redsys.ts`).
2. El navegador hace un POST a Redsys, donde se paga (3D Secure incluido). La web no ve
   nunca los datos de la tarjeta.
3. Redsys avisa al servidor en `POST /api/redsys/notify`. **Solo esa notificación, con la
   firma verificada, marca el pedido como pagado**, descuenta existencias, suma el uso del
   cupón y envía los correos. Es idempotente: si Redsys reintenta, no se aplica dos veces.
4. La clienta vuelve a `/es/pedido/<id>` (OK o KO). Esa página lee el estado de la base de
   datos; si el pago falló, ofrece reintentarlo con un número de operación nuevo.

Las pruebas de la firma están en `tests/redsys.test.ts` y se contrastan con OpenSSL.

---

## En local

```bash
npm install
cp .env.example .env        # rellena ADMIN_EMAIL y ADMIN_PASSWORD
npm run db:migrate          # crea la base de datos local (PGlite) y carga el catálogo
npm run dev                 # http://localhost:3000
npm test                    # pruebas de Redsys
```

Sin `DATABASE_URL` se usa PGlite (PostgreSQL embebido en `./.data`). Sin credenciales del
banco se usa el comercio de pruebas público de Redsys. Sin `RESEND_API_KEY` los correos se
guardan en la tabla `email_log`.

> La notificación de Redsys necesita una URL pública con HTTPS: desde `localhost` no llega.
> Para probar el pago real de prueba, despliega primero (o usa un túnel tipo ngrok y pon esa
> URL en `SITE_URL`).

---

## Despliegue en Hostinger (Web App Node.js)

1. **Base de datos**: crea un proyecto en Neon y copia la cadena de conexión.
2. En hPanel → *Websites* → *Add website* → **Node.js Web App** → conecta este repositorio
   de GitHub (rama `main`).
3. Ajustes de build:
   - Versión de Node: **20 o superior**
   - Build: `npm run build`
   - Start: `npm start` (aplica migraciones y arranca)
4. Variables de entorno (ver `.env.example`): como mínimo `SITE_URL`, `DATABASE_URL`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Después, las de Redsys, Resend y R2.
5. Conecta el dominio y comprueba que `https://tudominio/es` carga.
6. Entra en `https://tudominio/admin` con la cuenta de `ADMIN_EMAIL`.

### Redsys: qué pedir y configurar en el banco

Pide el **TPV Virtual en modalidad Redirección** (Andbank, MoraBanc o Crèdit Andorrà) con:
código de comercio (FUC), terminal, clave SHA-256 de pruebas y de producción, moneda EUR y
**notificación online por HTTP** activada. En el portal del TPV, la URL de notificación es:

```
https://tudominio/api/redsys/notify
```

Pruebas: deja `REDSYS_ENV=test` con las credenciales de prueba del banco y paga con las
tarjetas de prueba que te den. Producción: `REDSYS_ENV=production` con las credenciales de
producción. Antes de activar producción, el banco suele revisar las páginas legales: completa
lo marcado en amarillo en `lib/legal.ts`.

### Correos (Resend)

Crea la cuenta, verifica el dominio de la tienda (registros DNS) y añade `RESEND_API_KEY` y
`MAIL_FROM` con una dirección de ese dominio.

### Fotos (Cloudflare R2)

Crea un bucket público (o con dominio propio), un token de API con permiso de escritura y
rellena las variables `R2_*`. Las fotos iniciales del catálogo viven en `public/laupau` y no
dependen de R2.

---

## Pendiente de confirmar con Lau&Pau

- **Envíos**: los métodos y precios cargados son de ejemplo. El panel avisa hasta que se revisan.
  Ojo con los envíos fuera de Andorra (aduana).
- **Textos legales**: razón social, NRT, domicilio, plazos de devolución (`lib/legal.ts`).
- **Modelos y existencias** de cada producto (colores, tallas…): se gestionan en el panel.

## Estructura

```
app/[lang]/…          web pública (rutas internas en castellano; /ca/productes → /ca/productos)
app/admin/…           panel en catalán
app/actions/          acciones del servidor (tienda, cuenta, panel)
app/api/redsys/notify notificación de Redsys
lib/redsys.ts         firma y verificación de Redsys
lib/orders.ts         pedidos, pagos y aplicación de la notificación
lib/shop.ts           catálogo, cesta, envíos, cupones (los precios se calculan siempre aquí)
lib/i18n.ts           textos ES/CA
lib/db/schema.ts      esquema de la base de datos (migraciones en drizzle/)
components/effects.tsx comportamiento visual del diseño original (corazones, «&», etc.)
```

## Demo de prueba (artifact)

`demo/` es una versión de la tienda que funciona entera en el navegador, con datos, pagos y
correos simulados. Reutiliza los componentes, textos y estilos reales; solo sustituye el
servidor (`demo/mock`) y la navegación (`demo/shims`). Para regenerarla tras cambiar la web:

```bash
npm run demo:build      # genera demo/dist (index.html, app.js, app.css y las imágenes)
```
