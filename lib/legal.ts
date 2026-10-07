/**
 * Textos legales BASE. Lo marcado con <mark> son datos que faltan o que hay que
 * confirmar con la gestoría/asesoría antes de publicar. El banco suele revisar estas
 * páginas antes de activar el TPV en producción.
 */
import type { Lang } from './routes';

export type LegalPage = 'aviso-legal' | 'condiciones' | 'envios-y-devoluciones' | 'privacidad' | 'cookies';
export const LEGAL_PAGES: LegalPage[] = ['aviso-legal', 'condiciones', 'envios-y-devoluciones', 'privacidad', 'cookies'];

const HOLDER = '<mark>[Razón social / titular]</mark>';
const NRT = '<mark>[NRT]</mark>';
const ADDRESS = '<mark>[Domicilio completo, Andorra]</mark>';
const HOLDER_CA = '<mark>[Raó social / titular]</mark>';
const ADDRESS_CA = '<mark>[Domicili complet, Andorra]</mark>';

type Doc = { title: string; html: string };

export function legalDoc(page: LegalPage, lang: Lang, emailRaw: string): Doc {
  const email = emailRaw.replace(/[^\w.+@-]/g, '');
  const mail = `<a class="lp-link" href="mailto:${email}">${email}</a>`;
  const es: Record<LegalPage, Doc> = {
    'aviso-legal': {
      title: 'Aviso legal',
      html: `<p>Este sitio web es titularidad de ${HOLDER}, con NRT ${NRT} y domicilio en ${ADDRESS}. Correo de contacto: ${mail}.</p>
<h2>Uso del sitio</h2><p>El acceso a la web es libre. Quien la usa se compromete a hacerlo de buena fe y conforme a la ley.</p>
<h2>Propiedad intelectual</h2><p>Los textos, fotografías, logotipos y diseño de Lau&amp;Pau no pueden reproducirse sin autorización.</p>
<h2>Legislación aplicable</h2><p>Estas condiciones se rigen por la legislación del Principado de Andorra. <mark>Revisar con asesoría.</mark></p>`
    },
    condiciones: {
      title: 'Condiciones de venta',
      html: `<p>Estas condiciones regulan las compras realizadas en esta web a ${HOLDER} (NRT ${NRT}).</p>
<h2>Precios y pago</h2><p>Los precios se muestran en euros con impuestos incluidos. El pago se realiza con tarjeta a través de la pasarela segura Redsys de nuestra entidad bancaria. El pedido se confirma cuando el banco autoriza el pago.</p>
<h2>Productos personalizados</h2><p>Los productos personalizables se solicitan primero. Revisamos cada solicitud y enviamos el precio final, con cualquier posible suplemento, y un enlace de pago. La fabricación empieza cuando el pago está confirmado.</p>
<h2>Disponibilidad</h2><p>Si, de forma excepcional, un producto pagado no estuviera disponible, te avisaremos y te ofreceremos una alternativa o el reembolso íntegro.</p>
<h2>Envíos y devoluciones</h2><p>Consulta la página de envíos y devoluciones.</p>
<h2>Contacto y reclamaciones</h2><p>Para cualquier incidencia, escríbenos a ${mail}. <mark>Añadir hoja de reclamaciones u organismo de consumo según normativa andorrana.</mark></p>`
    },
    'envios-y-devoluciones': {
      title: 'Envíos y devoluciones',
      html: `<h2>Envíos</h2><p>Los métodos y costes de envío disponibles para tu país se muestran antes de pagar. <mark>Indicar plazos de entrega por destino.</mark></p>
<p>En envíos fuera de Andorra pueden aplicarse trámites aduaneros e impuestos de importación en destino. <mark>Confirmar quién los asume.</mark></p>
<h2>Devoluciones</h2><p>Puedes devolver los productos no personalizados en un plazo de <mark>14</mark> días desde la recepción, sin usar y en su embalaje original. Escríbenos a ${mail} para gestionarlo. <mark>Confirmar plazo y quién paga el envío de vuelta.</mark></p>
<p>Los productos personalizados no admiten devolución, salvo defecto o error nuestro.</p>
<h2>Reembolsos</h2><p>Una vez recibida y revisada la devolución, el reembolso se hace en la misma tarjeta con la que se pagó.</p>`
    },
    privacidad: {
      title: 'Política de privacidad',
      html: `<p>Responsable del tratamiento: ${HOLDER}, NRT ${NRT}, ${ADDRESS}. Contacto: ${mail}.</p>
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
  const ca: Record<LegalPage, Doc> = {
    'aviso-legal': {
      title: 'Avís legal',
      html: `<p>Aquest lloc web és titularitat de ${HOLDER_CA}, amb NRT ${NRT} i domicili a ${ADDRESS_CA}. Correu de contacte: ${mail}.</p>
<h2>Ús del lloc</h2><p>L’accés al web és lliure. Qui l’utilitza es compromet a fer-ho de bona fe i d’acord amb la llei.</p>
<h2>Propietat intel·lectual</h2><p>Els textos, les fotografies, els logotips i el disseny de Lau&amp;Pau no es poden reproduir sense autorització.</p>
<h2>Legislació aplicable</h2><p>Aquestes condicions es regeixen per la legislació del Principat d’Andorra. <mark>Revisar amb l’assessoria.</mark></p>`
    },
    condiciones: {
      title: 'Condicions de venda',
      html: `<p>Aquestes condicions regulen les compres fetes en aquest web a ${HOLDER_CA} (NRT ${NRT}).</p>
<h2>Preus i pagament</h2><p>Els preus es mostren en euros amb impostos inclosos. El pagament es fa amb targeta a través de la passarel·la segura Redsys de la nostra entitat bancària. La comanda es confirma quan el banc autoritza el pagament.</p>
<h2>Productes personalitzats</h2><p>Els productes personalitzables se sol·liciten primer. Revisem cada sol·licitud i enviem el preu final, amb qualsevol possible suplement, i un enllaç de pagament. La fabricació comença quan el pagament està confirmat.</p>
<h2>Disponibilitat</h2><p>Si, de manera excepcional, un producte pagat no estigués disponible, t’avisarem i t’oferirem una alternativa o el reemborsament íntegre.</p>
<h2>Enviaments i devolucions</h2><p>Consulta la pàgina d’enviaments i devolucions.</p>
<h2>Contacte i reclamacions</h2><p>Per a qualsevol incidència, escriu-nos a ${mail}. <mark>Afegir full de reclamacions o organisme de consum segons la normativa andorrana.</mark></p>`
    },
    'envios-y-devoluciones': {
      title: 'Enviaments i devolucions',
      html: `<h2>Enviaments</h2><p>Els mètodes i costos d’enviament disponibles per al teu país es mostren abans de pagar. <mark>Indicar terminis de lliurament per destinació.</mark></p>
<p>En els enviaments fora d’Andorra es poden aplicar tràmits duaners i impostos d’importació a la destinació. <mark>Confirmar qui els assumeix.</mark></p>
<h2>Devolucions</h2><p>Pots tornar els productes no personalitzats en un termini de <mark>14</mark> dies des de la recepció, sense fer servir i amb l’embalatge original. Escriu-nos a ${mail} per gestionar-ho. <mark>Confirmar termini i qui paga l’enviament de tornada.</mark></p>
<p>Els productes personalitzats no admeten devolució, tret de defecte o error nostre.</p>
<h2>Reemborsaments</h2><p>Un cop rebuda i revisada la devolució, el reemborsament es fa a la mateixa targeta amb què es va pagar.</p>`
    },
    privacidad: {
      title: 'Política de privacitat',
      html: `<p>Responsable del tractament: ${HOLDER_CA}, NRT ${NRT}, ${ADDRESS_CA}. Contacte: ${mail}.</p>
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
  return (lang === 'ca' ? ca : es)[page];
}
