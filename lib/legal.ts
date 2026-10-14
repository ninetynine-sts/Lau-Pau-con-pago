/**
 * Textos legals de la web. Inclouen els punts que el banc exigeix per activar el TPV:
 *  1. Identitat del venedor (nom comercial, raó social, NRT/registre, objecte social,
 *     domicili i contacte) → «Aviso legal», amb els valors de Configuració del tauler.
 *  2. Característiques essencials dels productes → «Condiciones», apartat Productos.
 *  3. Tipus de TPV i targetes (Visa i Mastercard, amb possibilitat de Bizum i Google Pay).
 *  4. Termini de devolucions → «Envíos y devoluciones».
 *  5. Frase literal de jurisdicció (tribunals del Principat d'Andorra) → aviso legal i
 *     condicions, en català literal també a la versió castellana.
 * El que encara falta es mostra marcat en groc (<mark>) fins que s'omple al tauler.
 */
import type { Lang } from './routes';
import { EMPTY_LEGAL, type LegalInfo } from './legal-info';

export type LegalPage = 'aviso-legal' | 'condiciones' | 'envios-y-devoluciones' | 'privacidad' | 'cookies';
export const LEGAL_PAGES: LegalPage[] = ['aviso-legal', 'condiciones', 'envios-y-devoluciones', 'privacidad', 'cookies'];

/** Frase que el banc demana literal. No la canviïs. */
export const JURISDICTION_CA = 'En cas de reclamació entre les dues parts es tractarà a tribunals del Principat d’Andorra.';
const JURISDICTION_ES = 'En caso de reclamación entre las dos partes, se tratará en los tribunales del Principado de Andorra.';

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Text de pagament (punt 3), també reutilitzat al peu i al pagament. */
export function paymentText(lang: Lang, bank: string): string {
  const b = bank.trim();
  return lang === 'ca'
    ? `El pagament es fa mitjançant TPV Virtual${b ? ` de ${b}` : ''} (passarel·la segura Redsys). Targetes acceptades: Visa i Mastercard, amb possibilitat de Bizum i Google Pay.`
    : `El pago se realiza mediante TPV Virtual${b ? ` de ${b}` : ''} (pasarela segura Redsys). Tarjetas aceptadas: Visa y Mastercard, con posibilidad de Bizum y Google Pay.`;
}

type Doc = { title: string; html: string };

export function legalDoc(page: LegalPage, lang: Lang, emailRaw: string, info: LegalInfo = EMPTY_LEGAL): Doc {
  const email = emailRaw.replace(/[^\w.+@-]/g, '');
  const mail = `<a class="lp-link" href="mailto:${email}">${email}</a>`;
  const ca = lang === 'ca';
  const v = (value: string, missing: string) => (value.trim() ? esc(value.trim()) : `<mark>[${missing}]</mark>`);

  const company = v(info.company, ca ? 'Raó social o titular' : 'Razón social o titular');
  const nrt = v(info.nrt, 'NRT');
  const address = v(info.address, ca ? 'Domicili complet, Andorra' : 'Domicilio completo, Andorra');
  const phone = v(info.phone, ca ? 'Telèfon' : 'Teléfono');
  const purpose = v(
    ca ? info.purposeCa || info.purposeEs : info.purposeEs || info.purposeCa,
    ca ? 'Objecte social' : 'Objeto social'
  );
  const registry = info.registry.trim() ? esc(info.registry.trim()) : '';
  const days = Math.max(1, Math.round(info.returnDays || 14));
  const tel = info.phone.trim()
    ? `<a class="lp-link" href="tel:${esc(info.phone.replace(/[^\d+]/g, ''))}">${phone}</a>`
    : phone;
  const pay = paymentText(lang, info.bank);
  const bankNote = info.bank.trim() ? '' : ca ? ' <mark>[Indicar l’entitat del TPV]</mark>' : ' <mark>[Indicar la entidad del TPV]</mark>';

  const identity = ca
    ? `<ul>
<li><b>Nom comercial:</b> Lau&amp;Pau</li>
<li><b>Titular:</b> ${company}</li>
<li><b>NRT:</b> ${nrt}</li>
${registry ? `<li><b>Núm. de registre de comerç:</b> ${registry}</li>` : ''}
<li><b>Objecte social:</b> ${purpose}</li>
<li><b>Domicili:</b> ${address}</li>
<li><b>Telèfon:</b> ${tel}</li>
<li><b>Correu electrònic:</b> ${mail}</li>
</ul>`
    : `<ul>
<li><b>Nombre comercial:</b> Lau&amp;Pau</li>
<li><b>Titular:</b> ${company}</li>
<li><b>NRT:</b> ${nrt}</li>
${registry ? `<li><b>N.º de registro de comercio:</b> ${registry}</li>` : ''}
<li><b>Objeto social:</b> ${purpose}</li>
<li><b>Domicilio:</b> ${address}</li>
<li><b>Teléfono:</b> ${tel}</li>
<li><b>Correo electrónico:</b> ${mail}</li>
</ul>`;

  const jurisdiction = ca
    ? `<p>Aquestes condicions es regeixen per la legislació del Principat d’Andorra. <b>${JURISDICTION_CA}</b></p>`
    : `<p>Estas condiciones se rigen por la legislación del Principado de Andorra. <b>${JURISDICTION_ES}</b></p><p lang="ca"><b>«${JURISDICTION_CA}»</b></p>`;

  const returnShipping =
    info.returnShippingBy === 'store'
      ? ca
        ? 'L’enviament de tornada va a càrrec nostre.'
        : 'El envío de vuelta corre de nuestra cuenta.'
      : ca
        ? 'L’enviament de tornada va a càrrec del client, excepte si el producte és defectuós o hi ha hagut un error nostre.'
        : 'El envío de vuelta corre a cargo del cliente, salvo que el producto sea defectuoso o haya habido un error nuestro.';

  const es: Record<LegalPage, Doc> = {
    'aviso-legal': {
      title: 'Aviso legal',
      html: `<h2>Identidad del vendedor</h2>${identity}
<h2>Uso del sitio</h2><p>El acceso a la web es libre. Quien la usa se compromete a hacerlo de buena fe y conforme a la ley.</p>
<h2>Propiedad intelectual</h2><p>Los textos, fotografías, logotipos y diseño de Lau&amp;Pau no pueden reproducirse sin autorización.</p>
<h2>Legislación aplicable y jurisdicción</h2>${jurisdiction}`
    },
    condiciones: {
      title: 'Condiciones de venta',
      html: `<p>Estas condiciones regulan las compras realizadas en esta web a ${company} (NRT ${nrt}), con domicilio en ${address}. Consulta todos los datos en el aviso legal.</p>
<h2>Productos</h2><p>Las características esenciales de cada producto (descripción, materiales, colores o modelos disponibles y precio final) se muestran en su ficha antes de comprar. Las fotografías muestran el producto real; pueden existir pequeñas variaciones de tono según la pantalla.</p>
<h2>Precios y pago</h2><p>Los precios se muestran en euros con impuestos incluidos. Antes de pagar se indica el coste de envío.</p><p>${pay}${bankNote} El pedido se confirma cuando el banco autoriza el pago. Nunca vemos ni guardamos los datos de tu tarjeta.</p>
<h2>Productos personalizados</h2><p>Los productos personalizables se solicitan primero. Revisamos cada solicitud y enviamos el precio final, con cualquier posible suplemento, y un enlace de pago. La fabricación empieza cuando el pago está confirmado.</p>
<h2>Disponibilidad</h2><p>Si, de forma excepcional, un producto pagado no estuviera disponible, te avisaremos y te ofreceremos una alternativa o el reembolso íntegro.</p>
<h2>Devoluciones</h2><p>Dispones de ${days} días desde la recepción para devolver los productos no personalizados. Consulta las condiciones completas en la página de envíos y devoluciones.</p>
<h2>Contacto y reclamaciones</h2><p>Para cualquier incidencia, escríbenos a ${mail} o llámanos al ${tel}.</p>
<h2>Legislación aplicable y jurisdicción</h2>${jurisdiction}`
    },
    'envios-y-devoluciones': {
      title: 'Envíos y devoluciones',
      html: `<h2>Envíos</h2><p>Los métodos y costes de envío disponibles para tu país se muestran antes de pagar. <mark>Indicar plazos de entrega por destino.</mark></p>
<p>En envíos fuera de Andorra pueden aplicarse trámites aduaneros e impuestos de importación en destino. <mark>Confirmar quién los asume.</mark></p>
<h2>Plazo de devolución</h2><p>Puedes devolver los productos no personalizados en un plazo de <b>${days} días naturales</b> desde la recepción del pedido, sin usar y en su embalaje original. Para hacerlo, escríbenos a ${mail} indicando el número de pedido. ${returnShipping}</p>
<p>Los productos personalizados no admiten devolución, salvo defecto o error nuestro.</p>
<h2>Reembolsos</h2><p>Una vez recibida y revisada la devolución, el reembolso se hace por el mismo medio de pago utilizado en la compra.</p>`
    },
    privacidad: {
      title: 'Política de privacidad',
      html: `<p>Responsable del tratamiento: ${company}, NRT ${nrt}, ${address}. Contacto: ${mail}.</p>
<h2>Qué datos tratamos y para qué</h2><ul><li>Datos de contacto y envío: para gestionar pedidos y solicitudes de personalización.</li><li>Datos de la cuenta: para que puedas consultar tus pedidos y direcciones.</li></ul>
<p>Los datos de la tarjeta los trata directamente la pasarela de pago del banco (Redsys): nunca los vemos ni los guardamos.</p>
<h2>Conservación</h2><p>Conservamos los datos mientras dure la relación y el tiempo que exijan las obligaciones legales y fiscales.</p>
<h2>Destinatarios</h2><p>Proveedores necesarios para prestar el servicio: alojamiento web, envío de correos, entidad bancaria y empresa de transporte. <mark>Detallar proveedores y si hay transferencias internacionales.</mark></p>
<h2>Tus derechos</h2><p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${mail}, y presentar una reclamación ante la Agència Andorrana de Protecció de Dades. <mark>Revisar con asesoría (Llei 29/2021).</mark></p>`
    },
    cookies: {
      title: 'Cookies',
      html: `<p>Esta web solo usa cookies y almacenamiento técnicos, necesarios para que funcione:</p>
<ul><li><b>lp_session</b>: mantiene la sesión iniciada en tu cuenta.</li><li><b>lp_lang</b>: recuerda el idioma elegido.</li><li><b>Cesta</b>: se guarda en el almacenamiento local de tu navegador.</li></ul>
<p>No usamos cookies de analítica ni de publicidad. Si en el futuro se añaden, se pedirá tu consentimiento.</p>`
    }
  };

  const caDocs: Record<LegalPage, Doc> = {
    'aviso-legal': {
      title: 'Avís legal',
      html: `<h2>Identitat del venedor</h2>${identity}
<h2>Ús del lloc</h2><p>L’accés al web és lliure. Qui l’utilitza es compromet a fer-ho de bona fe i d’acord amb la llei.</p>
<h2>Propietat intel·lectual</h2><p>Els textos, les fotografies, els logotips i el disseny de Lau&amp;Pau no es poden reproduir sense autorització.</p>
<h2>Legislació aplicable i jurisdicció</h2>${jurisdiction}`
    },
    condiciones: {
      title: 'Condicions de venda',
      html: `<p>Aquestes condicions regulen les compres fetes en aquest web a ${company} (NRT ${nrt}), amb domicili a ${address}. Totes les dades són a l’avís legal.</p>
<h2>Productes</h2><p>Les característiques essencials de cada producte (descripció, materials, colors o models disponibles i preu final) es mostren a la seva fitxa abans de comprar. Les fotografies mostren el producte real; hi pot haver petites variacions de to segons la pantalla.</p>
<h2>Preus i pagament</h2><p>Els preus es mostren en euros amb impostos inclosos. Abans de pagar s’indica el cost de l’enviament.</p><p>${pay}${bankNote} La comanda es confirma quan el banc autoritza el pagament. No veiem ni desem mai les dades de la teva targeta.</p>
<h2>Productes personalitzats</h2><p>Els productes personalitzables se sol·liciten primer. Revisem cada sol·licitud i enviem el preu final, amb qualsevol possible suplement, i un enllaç de pagament. La fabricació comença quan el pagament està confirmat.</p>
<h2>Disponibilitat</h2><p>Si, de manera excepcional, un producte pagat no estigués disponible, t’avisarem i t’oferirem una alternativa o el reemborsament íntegre.</p>
<h2>Devolucions</h2><p>Disposes de ${days} dies des de la recepció per tornar els productes no personalitzats. Consulta les condicions completes a la pàgina d’enviaments i devolucions.</p>
<h2>Contacte i reclamacions</h2><p>Per a qualsevol incidència, escriu-nos a ${mail} o truca’ns al ${tel}.</p>
<h2>Legislació aplicable i jurisdicció</h2>${jurisdiction}`
    },
    'envios-y-devoluciones': {
      title: 'Enviaments i devolucions',
      html: `<h2>Enviaments</h2><p>Els mètodes i costos d’enviament disponibles per al teu país es mostren abans de pagar. <mark>Indicar terminis de lliurament per destinació.</mark></p>
<p>En els enviaments fora d’Andorra es poden aplicar tràmits duaners i impostos d’importació a la destinació. <mark>Confirmar qui els assumeix.</mark></p>
<h2>Termini de devolució</h2><p>Pots tornar els productes no personalitzats en un termini de <b>${days} dies naturals</b> des de la recepció de la comanda, sense fer servir i amb l’embalatge original. Per fer-ho, escriu-nos a ${mail} indicant el número de comanda. ${returnShipping}</p>
<p>Els productes personalitzats no admeten devolució, tret de defecte o error nostre.</p>
<h2>Reemborsaments</h2><p>Un cop rebuda i revisada la devolució, el reemborsament es fa pel mateix mitjà de pagament utilitzat en la compra.</p>`
    },
    privacidad: {
      title: 'Política de privacitat',
      html: `<p>Responsable del tractament: ${company}, NRT ${nrt}, ${address}. Contacte: ${mail}.</p>
<h2>Quines dades tractem i per a què</h2><ul><li>Dades de contacte i d’enviament: per gestionar comandes i sol·licituds de personalització.</li><li>Dades del compte: perquè puguis consultar les teves comandes i adreces.</li></ul>
<p>Les dades de la targeta les tracta directament la passarel·la de pagament del banc (Redsys): no les veiem ni les desem mai.</p>
<h2>Conservació</h2><p>Conservem les dades mentre duri la relació i el temps que exigeixin les obligacions legals i fiscals.</p>
<h2>Destinataris</h2><p>Proveïdors necessaris per prestar el servei: allotjament web, enviament de correus, entitat bancària i empresa de transport. <mark>Detallar proveïdors i si hi ha transferències internacionals.</mark></p>
<h2>Els teus drets</h2><p>Pots exercir els drets d’accés, rectificació, supressió, oposició, limitació i portabilitat escrivint a ${mail}, i presentar una reclamació davant l’Agència Andorrana de Protecció de Dades. <mark>Revisar amb l’assessoria (Llei 29/2021).</mark></p>`
    },
    cookies: {
      title: 'Galetes',
      html: `<p>Aquest web només fa servir galetes i emmagatzematge tècnics, necessaris perquè funcioni:</p>
<ul><li><b>lp_session</b>: manté la sessió iniciada al teu compte.</li><li><b>lp_lang</b>: recorda l’idioma triat.</li><li><b>Cistella</b>: es desa a l’emmagatzematge local del navegador.</li></ul>
<p>No fem servir galetes d’analítica ni de publicitat. Si en el futur se n’afegeixen, se’t demanarà el consentiment.</p>`
    }
  };
  return (ca ? caDocs : es)[page];
}
