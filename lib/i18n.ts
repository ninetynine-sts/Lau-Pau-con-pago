/**
 * Textos de la web pública en castellano y catalán.
 * Los textos castellanos de la web original se mantienen tal cual.
 */
import type { Lang } from './routes';

export type Localized = { es: string; ca: string };

export function loc(v: Localized | null | undefined, lang: Lang): string {
  if (!v) return '';
  return v[lang] || v.es || v.ca || '';
}

export function formatPrice(cents: number, lang: Lang = 'es'): string {
  return new Intl.NumberFormat(lang === 'ca' ? 'ca-ES' : 'es-ES', { style: 'currency', currency: 'EUR' }).format(
    cents / 100
  );
}

export function formatDate(d: Date | string, lang: Lang = 'es'): string {
  return new Intl.DateTimeFormat(lang === 'ca' ? 'ca-ES' : 'es-ES', { dateStyle: 'long' }).format(new Date(d));
}

export function orderNumber(id: number): string {
  return `LP-${1000 + id}`;
}

const es = {
  langName: 'Castellano',
  otherLangLabel: 'Català',
  skip: 'Saltar al contenido',
  menu: 'Menú',
  logoAlt: 'Lau&Pau, nombre en marrón dentro de un círculo fino con un corazón debajo.',
  logoHome: 'Lau&Pau, ir al inicio',
  nav: { products: 'Productos', personalize: 'Personaliza', about: 'Quiénes somos', contact: 'Contacto' },
  cart: 'Cesta',
  cartCount: (n: number) => (n === 1 ? '1 artículo en la cesta' : `${n} artículos en la cesta`),
  account: 'Mi cuenta',
  footer: {
    contact: 'Contacto',
    writeUs: 'Escríbenos a',
    instagram: 'Nos vemos en Instagram:',
    navigation: 'Navegación',
    legal: 'Información legal',
    taxes: 'Precios con impuestos incluidos.',
    country: 'Andorra'
  },
  legalLinks: {
    notice: 'Aviso legal',
    terms: 'Condiciones de venta',
    shipping: 'Envíos y devoluciones',
    privacy: 'Privacidad',
    cookies: 'Cookies'
  },
  home: {
    eyebrow: 'Accesorios y detalles con personalidad',
    h1a: 'Pequeños detalles.',
    h1b: 'Mucho de ti.',
    lead: 'Una selección de Laura y Paula para acompañarte cada día y encontrar ese detalle que puedes hacer un poquito más tuyo.',
    ctaProducts: 'Descubrir productos',
    ctaPersonalize: 'Personaliza tu detalle',
    chipRefs: 'referencias',
    chipPersonal: 'personalizables',
    chipFrom: 'Desde ',
    selEyebrow: 'La selección',
    selTitle: 'Pequeños detalles, mucha personalidad',
    selLead:
      'Accesorios para acompañarte cada día y detalles que puedes hacer un poquito más tuyos. Descubre nuestra selección y encuentra ese próximo flechazo.',
    seeAll: 'Ver el catálogo completo',
    perTitle: 'Hazlo un poquito más tuyo',
    perLeadA: 'Tu inicial.',
    perLeadB: 'Tu detalle.',
    perText:
      'Una letra que te representa o una idea para alguien especial. Cuéntanos qué tienes en mente y te ayudaremos a conocer las opciones disponibles.',
    aboutEyebrow: 'Quiénes somos',
    aboutText:
      'Somos Laura y Paula, dos amigas y socias con muchos años de experiencia en el comercio. Creamos Lau&Pau para dar forma a un proyecto que hablara de nosotras: de lo que nos gusta, de nuestra manera de entender las tendencias y del valor que damos a los pequeños detalles.',
    aboutLink: 'Conoce nuestra historia',
    bandEyebrow: 'Nuestra manera de hacer',
    bandTitle: 'Tendencia, personalidad y pequeños detalles',
    bandLead:
      'Creemos que algo sencillo puede convertirse en algo especial. Una letra, un accesorio o un detalle elegido pensando en alguien pueden decir mucho.',
    igTitle: 'Nos vemos en Instagram',
    igLead: 'Descubre nuestras novedades, ideas para regalar y un poquito del día a día de Lau&Pau.',
    igCta: 'Seguir a'
  },
  catalog: {
    eyebrow: 'Catálogo',
    title: 'Pequeños detalles, mucha personalidad',
    lead: 'Accesorios para acompañarte cada día y detalles que puedes hacer un poquito más tuyos. Descubre nuestra selección y encuentra ese próximo flechazo.',
    filterLabel: 'Filtrar por categoría',
    all: 'Todos',
    count: (n: number) => (n === 1 ? '1 producto' : `${n} productos`),
    empty: 'Todavía no hay productos en esta categoría.',
    note: 'Las fotografías muestran ejemplos y surtidos del producto. Si buscas un modelo o color concreto, indícalo en las notas del pedido.',
    buy: 'Comprar',
    request: 'Solicitar personalización',
    soldOut: 'Agotado'
  },
  product: {
    color: 'Color',
    colorsCount: (n: number) => (n === 1 ? '1 color' : `${n} colores`),
    colorRequired: 'Elige un color.',
    home: 'Inicio',
    products: 'Productos',
    category: 'Categoría',
    reference: 'Referencia',
    availability: 'Disponibilidad',
    inStock: 'Disponible',
    fewLeft: (n: number) => (n === 1 ? 'Queda 1 unidad' : `Quedan ${n} unidades`),
    soldOut: 'Agotado',
    variant: 'Modelo',
    chooseVariant: 'Elige un modelo',
    quantity: 'Unidades',
    less: 'Quitar una unidad',
    more: 'Añadir una unidad',
    addToCart: 'Añadir a la cesta',
    added: 'Añadido a la cesta',
    viewCart: 'Ver la cesta',
    maxStock: (n: number) => `Solo quedan ${n} unidades disponibles.`,
    priceFrom: 'Precio base',
    personalNote: 'Precio final a confirmar',
    howTitle: 'Cómo funciona la personalización',
    how1: 'Nos envías tu solicitud con la letra o la idea.',
    how2: 'La revisamos y te escribimos con el precio final, incluido cualquier suplemento.',
    how3: 'Recibes un enlace para pagar de forma segura. Preparamos tu pedido cuando está pagado.',
    seeAllPersonal: 'Ver todo lo personalizable'
  },
  request: {
    title: 'Solicita tu personalización',
    letterError: 'Indica una sola letra.',
    ideaError: 'Cuéntanos tu idea para poder confirmarte las opciones.',
    ideaTooLong: (n: number) => `Tu idea admite hasta ${n} caracteres.`,
    notes: '¿Quieres contarnos algo más?',
    notesTooLong: 'Las observaciones admiten hasta 500 caracteres.',
    name: 'Nombre',
    email: 'Correo electrónico',
    phone: 'Teléfono (opcional)',
    privacy: 'Usaremos tus datos solo para responder a esta solicitud.',
    submit: 'Enviar solicitud',
    sending: 'Enviando…',
    doneTitle: '¡Solicitud enviada!',
    doneText:
      'Te hemos enviado una copia por correo. Laura y Paula la revisarán y te escribirán con el precio final y el enlace de pago.',
    another: 'Enviar otra solicitud',
    note: 'Esta solicitud no es un pedido cerrado: no pagas nada hasta que te confirmemos el precio final.'
  },
  cartPage: {
    title: 'Tu cesta',
    empty: 'Tu cesta está vacía.',
    browse: 'Descubrir productos',
    remove: 'Quitar',
    subtotal: 'Subtotal',
    shippingNote: 'Los gastos de envío y los descuentos se calculan en el siguiente paso.',
    checkout: 'Finalizar compra',
    continue: 'Seguir comprando',
    unavailable: 'Este producto ya no está disponible y no se incluirá en el pedido.',
    adjusted: (n: number) => `Solo quedan ${n} unidades: hemos ajustado la cantidad.`
  },
  checkout: {
    title: 'Finalizar compra',
    contact: 'Datos de contacto',
    email: 'Correo electrónico',
    name: 'Nombre y apellidos',
    phone: 'Teléfono',
    loggedAs: (email: string) => `Compras como ${email}.`,
    haveAccount: '¿Ya tienes cuenta?',
    login: 'Inicia sesión',
    shipping: 'Envío',
    country: 'País',
    method: 'Método de envío',
    noMethods: 'Ahora mismo no enviamos a este país. Escríbenos y buscamos una solución.',
    address: 'Dirección',
    line1: 'Calle y número',
    line2: 'Piso, puerta… (opcional)',
    city: 'Población',
    postalCode: 'Código postal',
    region: 'Parroquia / provincia (opcional)',
    savedAddresses: 'Usar una dirección guardada',
    saveAddress: 'Guardar esta dirección en mi cuenta',
    coupon: 'Código de descuento',
    apply: 'Aplicar',
    couponApplied: (code: string) => `Código ${code} aplicado.`,
    removeCoupon: 'Quitar',
    notes: 'Notas para el pedido (opcional)',
    notesHelp: 'Por ejemplo, el color o el modelo que prefieres.',
    summary: 'Resumen',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    shippingCost: 'Envío',
    free: 'Gratis',
    freeFrom: (amount: string) => `Gratis a partir de ${amount}`,
    total: 'Total',
    taxes: 'Impuestos incluidos',
    terms: 'He leído y acepto las',
    termsLink: 'condiciones de venta',
    and: 'y la',
    privacyLink: 'política de privacidad',
    pay: 'Pagar con tarjeta',
    redirecting: 'Te llevamos a la pasarela de pago segura…',
    secure: 'Pago seguro con tarjeta a través de Redsys. Nunca vemos ni guardamos los datos de tu tarjeta.',
    emptyCart: 'Tu cesta está vacía.',
    errors: {
      required: 'Este campo es obligatorio.',
      email: 'Revisa el correo electrónico.',
      terms: 'Necesitamos que aceptes las condiciones de venta.',
      method: 'Elige un método de envío.',
      stock: 'Algún producto ya no tiene existencias suficientes. Revisa tu cesta.',
      generic: 'No hemos podido crear el pedido. Inténtalo de nuevo en unos minutos.'
    },
    couponErrors: {
      invalid: 'Este código no existe.',
      expired: 'Este código ha caducado.',
      notStarted: 'Este código todavía no está activo.',
      exhausted: 'Este código ya se ha usado el máximo de veces.',
      minimum: (amount: string) => `Este código es válido a partir de ${amount}.`
    }
  },
  order: {
    title: (n: string) => `Pedido ${n}`,
    thanks: '¡Gracias por tu compra!',
    paidText: 'Hemos recibido tu pago. Te hemos enviado la confirmación por correo y te avisaremos cuando enviemos el pedido.',
    pendingTitle: 'Estamos confirmando tu pago',
    pendingText: 'Puede tardar unos segundos. Esta página se actualiza sola.',
    failedTitle: 'El pago no se ha completado',
    failedText: 'No se ha realizado ningún cargo. Puedes volver a intentarlo cuando quieras.',
    retry: 'Volver a intentar el pago',
    items: 'Artículos',
    shipTo: 'Envío a',
    pickup: 'Recogida',
    tracking: 'Seguimiento del envío',
    status: 'Estado',
    date: 'Fecha',
    letter: 'Letra',
    idea: 'Idea',
    statuses: {
      pending_payment: 'Pendiente de pago',
      paid: 'Pagado',
      preparing: 'En preparación',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado'
    } as Record<string, string>
  },
  payLink: {
    title: 'Tu personalización está lista para pagar',
    intro: 'Laura y Paula han revisado tu solicitud. Comprueba el resumen, elige el envío y paga de forma segura.',
    message: 'Mensaje de Lau&Pau',
    expired: 'Este enlace de pago ha caducado. Escríbenos y te enviamos uno nuevo.',
    paid: 'Este pedido ya está pagado. ¡Gracias!',
    validUntil: (d: string) => `Enlace válido hasta el ${d}.`
  },
  accountPages: {
    title: 'Mi cuenta',
    login: 'Iniciar sesión',
    loginCta: 'Entrar',
    register: 'Crear cuenta',
    registerCta: 'Crear mi cuenta',
    noAccount: '¿Todavía no tienes cuenta?',
    hasAccount: '¿Ya tienes cuenta?',
    forgot: '¿Has olvidado tu contraseña?',
    email: 'Correo electrónico',
    password: 'Contraseña',
    passwordHelp: 'Mínimo 10 caracteres.',
    newPassword: 'Nueva contraseña',
    currentPassword: 'Contraseña actual',
    name: 'Nombre',
    phone: 'Teléfono',
    logout: 'Cerrar sesión',
    orders: 'Pedidos',
    requests: 'Solicitudes',
    addresses: 'Direcciones',
    details: 'Mis datos',
    noOrders: 'Todavía no has hecho ningún pedido.',
    noRequests: 'No tienes solicitudes de personalización.',
    noAddresses: 'No tienes direcciones guardadas.',
    view: 'Ver',
    pay: 'Pagar',
    save: 'Guardar',
    saved: 'Cambios guardados.',
    delete: 'Eliminar',
    addAddress: 'Añadir dirección',
    label: 'Nombre de la dirección (casa, trabajo…)',
    default: 'Predeterminada',
    makeDefault: 'Usar como predeterminada',
    recoverTitle: 'Recuperar contraseña',
    recoverText: 'Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.',
    recoverCta: 'Enviar enlace',
    recoverSent: 'Si hay una cuenta con ese correo, te hemos enviado un enlace. Revisa también la carpeta de spam.',
    resetTitle: 'Crea una nueva contraseña',
    resetCta: 'Guardar contraseña',
    resetInvalid: 'Este enlace no es válido o ha caducado. Pide uno nuevo.',
    resetDone: 'Contraseña actualizada. Ya puedes entrar.',
    changePassword: 'Cambiar contraseña',
    errors: {
      credentials: 'El correo o la contraseña no son correctos.',
      exists: 'Ya hay una cuenta con este correo. Inicia sesión o recupera tu contraseña.',
      password: 'La contraseña debe tener al menos 10 caracteres.',
      current: 'La contraseña actual no es correcta.',
      tooMany: 'Demasiados intentos. Espera unos minutos.',
      required: 'Completa los campos obligatorios.'
    },
    requestStatuses: {
      new: 'Recibida',
      quoted: 'Pendiente de pago',
      paid: 'Pagada',
      rejected: 'No disponible',
      expired: 'Caducada'
    } as Record<string, string>
  },
  about: {
    eyebrow: 'Dos amigas, un proyecto',
    p: [
      'Somos Laura y Paula, dos amigas y socias con muchos años de experiencia en el comercio. Creamos Lau&Pau para dar forma a un proyecto que hablara de nosotras: de lo que nos gusta, de nuestra manera de entender las tendencias y del valor que damos a los pequeños detalles.',
      'Paula es la parte más inquieta y creativa del proyecto. Está detrás de la selección de productos, las nuevas ideas, las personalizaciones y el día a día de Lau&Pau.',
      'Laura aporta nuestra mirada a las tendencias. Siempre atenta a lo que viene y a esos detalles capaces de transformar un accesorio, su criterio nos ayuda a elegir qué queremos que forme parte de la marca.',
      'Desde Andorra, combinamos creatividad, experiencia y cercanía para ofrecer accesorios y detalles con personalidad. Detrás de cada selección, cada personalización y cada pedido estamos nosotras.'
    ],
    signoff: 'Laura y Paula. Encantadas de formar parte de tus pequeños detalles.',
    philTitle: 'Tendencia, personalidad y pequeños detalles',
    phil: [
      'En Lau&Pau hacemos las cosas con ilusión y con criterio. Nos gusta descubrir productos diferentes, estar atentas a las tendencias y seleccionar aquello que realmente nos gusta y creemos que puede gustarte a ti también.',
      'Creemos que algo sencillo puede convertirse en algo especial. Una letra, un accesorio o un detalle elegido pensando en alguien pueden decir mucho.',
      'Trabajamos de forma cercana, cuidando cada selección y cada pedido como nos gustaría que lo hicieran para nosotras. Queremos que encuentres una marca bonita y con personalidad, con personas de verdad al otro lado.'
    ],
    values: [
      ['Seleccionamos con criterio', 'Productos que nos gustan y que encajan con nuestra manera de entender las tendencias.'],
      ['Cuidamos los detalles', 'Pequeños gestos y opciones de personalización que aportan significado.'],
      ['Estamos cerca', 'Laura y Paula, detrás de las ideas, las consultas y los pedidos.']
    ] as [string, string][]
  },
  personalize: {
    eyebrow: 'Personalización',
    note: 'Revisamos cada solicitud y te confirmamos las opciones y el precio final, con cualquier posible suplemento, antes de que pagues nada.',
    fullSheet: 'Ver la ficha completa'
  },
  drawer: {
    title: 'Tu cesta',
    close: 'Cerrar la cesta',
    empty: 'Tu cesta está vacía. Echa un vistazo a la selección y encuentra ese próximo flechazo.',
    emptyCta: 'Descubrir productos',
    checkout: 'Finalizar compra',
    viewCart: 'Ver la cesta completa',
    note: 'Envío y descuentos en el siguiente paso.',
    items: (n: number) => (n === 1 ? '1 artículo' : `${n} artículos`),
    dragHint: 'Desliza hacia abajo para cerrar'
  },
  marquee: ['Pequeños detalles', 'Mucho de ti', 'Tu inicial', 'Tu detalle', 'Desde Andorra'],
  menuClose: 'Cerrar el menú',
  heroChip: 'Ver el detalle',
  notFound: {
    title: 'No encontramos esta página',
    text: 'Puede que el enlace haya cambiado. Vuelve al inicio o echa un vistazo al catálogo.',
    home: 'Ir al inicio',
    products: 'Ver productos'
  }
};

export type Dict = typeof es;

const ca: Dict = {
  langName: 'Català',
  otherLangLabel: 'Castellano',
  skip: 'Salta al contingut',
  menu: 'Menú',
  logoAlt: 'Lau&Pau, nom en marró dins d’un cercle fi amb un cor a sota.',
  logoHome: 'Lau&Pau, ves a l’inici',
  nav: { products: 'Productes', personalize: 'Personalitza', about: 'Qui som', contact: 'Contacte' },
  cart: 'Cistella',
  cartCount: (n) => (n === 1 ? '1 article a la cistella' : `${n} articles a la cistella`),
  account: 'El meu compte',
  footer: {
    contact: 'Contacte',
    writeUs: 'Escriu-nos a',
    instagram: 'Ens veiem a Instagram:',
    navigation: 'Navegació',
    legal: 'Informació legal',
    taxes: 'Preus amb impostos inclosos.',
    country: 'Andorra'
  },
  legalLinks: {
    notice: 'Avís legal',
    terms: 'Condicions de venda',
    shipping: 'Enviaments i devolucions',
    privacy: 'Privacitat',
    cookies: 'Galetes'
  },
  home: {
    eyebrow: 'Accessoris i detalls amb personalitat',
    h1a: 'Petits detalls.',
    h1b: 'Molt de tu.',
    lead: 'Una selecció de la Laura i la Paula per acompanyar-te cada dia i trobar aquell detall que pots fer una mica més teu.',
    ctaProducts: 'Descobreix els productes',
    ctaPersonalize: 'Personalitza el teu detall',
    chipRefs: 'referències',
    chipPersonal: 'personalitzables',
    chipFrom: 'Des d’',
    selEyebrow: 'La selecció',
    selTitle: 'Petits detalls, molta personalitat',
    selLead:
      'Accessoris per acompanyar-te cada dia i detalls que pots fer una mica més teus. Descobreix la nostra selecció i troba el teu proper caprici.',
    seeAll: 'Veure tot el catàleg',
    perTitle: 'Fes-ho una mica més teu',
    perLeadA: 'La teva inicial.',
    perLeadB: 'El teu detall.',
    perText:
      'Una lletra que et representa o una idea per a algú especial. Explica’ns què tens al cap i t’ajudarem a conèixer les opcions disponibles.',
    aboutEyebrow: 'Qui som',
    aboutText:
      'Som la Laura i la Paula, dues amigues i sòcies amb molts anys d’experiència en el comerç. Vam crear Lau&Pau per donar forma a un projecte que parlés de nosaltres: del que ens agrada, de la nostra manera d’entendre les tendències i del valor que donem als petits detalls.',
    aboutLink: 'Coneix la nostra història',
    bandEyebrow: 'La nostra manera de fer',
    bandTitle: 'Tendència, personalitat i petits detalls',
    bandLead:
      'Creiem que una cosa senzilla pot convertir-se en una cosa especial. Una lletra, un accessori o un detall triat pensant en algú poden dir molt.',
    igTitle: 'Ens veiem a Instagram',
    igLead: 'Descobreix les nostres novetats, idees per regalar i una mica del dia a dia de Lau&Pau.',
    igCta: 'Segueix'
  },
  catalog: {
    eyebrow: 'Catàleg',
    title: 'Petits detalls, molta personalitat',
    lead: 'Accessoris per acompanyar-te cada dia i detalls que pots fer una mica més teus. Descobreix la nostra selecció i troba el teu proper caprici.',
    filterLabel: 'Filtra per categoria',
    all: 'Tots',
    count: (n) => (n === 1 ? '1 producte' : `${n} productes`),
    empty: 'Encara no hi ha productes en aquesta categoria.',
    note: 'Les fotografies mostren exemples i assortiments del producte. Si busques un model o un color concret, indica-ho a les notes de la comanda.',
    buy: 'Comprar',
    request: 'Sol·licitar personalització',
    soldOut: 'Esgotat'
  },
  product: {
    color: 'Color',
    colorsCount: (n: number) => (n === 1 ? '1 color' : `${n} colors`),
    colorRequired: 'Tria un color.',
    home: 'Inici',
    products: 'Productes',
    category: 'Categoria',
    reference: 'Referència',
    availability: 'Disponibilitat',
    inStock: 'Disponible',
    fewLeft: (n) => (n === 1 ? 'En queda 1 unitat' : `En queden ${n} unitats`),
    soldOut: 'Esgotat',
    variant: 'Model',
    chooseVariant: 'Tria un model',
    quantity: 'Unitats',
    less: 'Treu una unitat',
    more: 'Afegeix una unitat',
    addToCart: 'Afegeix a la cistella',
    added: 'Afegit a la cistella',
    viewCart: 'Veure la cistella',
    maxStock: (n) => `Només en queden ${n} unitats disponibles.`,
    priceFrom: 'Preu base',
    personalNote: 'Preu final per confirmar',
    howTitle: 'Com funciona la personalització',
    how1: 'Ens envies la sol·licitud amb la lletra o la idea.',
    how2: 'La revisem i t’escrivim amb el preu final, inclòs qualsevol suplement.',
    how3: 'Reps un enllaç per pagar de manera segura. Preparem la comanda quan està pagada.',
    seeAllPersonal: 'Veure tot el que es pot personalitzar'
  },
  request: {
    title: 'Sol·licita la teva personalització',
    letterError: 'Indica una sola lletra.',
    ideaError: 'Explica’ns la teva idea perquè et puguem confirmar les opcions.',
    ideaTooLong: (n) => `La teva idea admet fins a ${n} caràcters.`,
    notes: 'Vols explicar-nos alguna cosa més?',
    notesTooLong: 'Les observacions admeten fins a 500 caràcters.',
    name: 'Nom',
    email: 'Correu electrònic',
    phone: 'Telèfon (opcional)',
    privacy: 'Farem servir les teves dades només per respondre aquesta sol·licitud.',
    submit: 'Envia la sol·licitud',
    sending: 'S’està enviant…',
    doneTitle: 'Sol·licitud enviada!',
    doneText:
      'T’hem enviat una còpia per correu. La Laura i la Paula la revisaran i t’escriuran amb el preu final i l’enllaç de pagament.',
    another: 'Envia una altra sol·licitud',
    note: 'Aquesta sol·licitud no és una comanda tancada: no pagues res fins que no et confirmem el preu final.'
  },
  cartPage: {
    title: 'La teva cistella',
    empty: 'La teva cistella és buida.',
    browse: 'Descobreix els productes',
    remove: 'Treu',
    subtotal: 'Subtotal',
    shippingNote: 'Les despeses d’enviament i els descomptes es calculen al pas següent.',
    checkout: 'Finalitza la compra',
    continue: 'Continua comprant',
    unavailable: 'Aquest producte ja no està disponible i no s’inclourà a la comanda.',
    adjusted: (n) => `Només en queden ${n} unitats: hem ajustat la quantitat.`
  },
  checkout: {
    title: 'Finalitza la compra',
    contact: 'Dades de contacte',
    email: 'Correu electrònic',
    name: 'Nom i cognoms',
    phone: 'Telèfon',
    loggedAs: (email) => `Compres com a ${email}.`,
    haveAccount: 'Ja tens compte?',
    login: 'Inicia la sessió',
    shipping: 'Enviament',
    country: 'País',
    method: 'Mètode d’enviament',
    noMethods: 'Ara mateix no enviem a aquest país. Escriu-nos i hi buscarem una solució.',
    address: 'Adreça',
    line1: 'Carrer i número',
    line2: 'Pis, porta… (opcional)',
    city: 'Població',
    postalCode: 'Codi postal',
    region: 'Parròquia / província (opcional)',
    savedAddresses: 'Fes servir una adreça desada',
    saveAddress: 'Desa aquesta adreça al meu compte',
    coupon: 'Codi de descompte',
    apply: 'Aplica',
    couponApplied: (code) => `Codi ${code} aplicat.`,
    removeCoupon: 'Treu',
    notes: 'Notes per a la comanda (opcional)',
    notesHelp: 'Per exemple, el color o el model que prefereixes.',
    summary: 'Resum',
    subtotal: 'Subtotal',
    discount: 'Descompte',
    shippingCost: 'Enviament',
    free: 'Gratuït',
    freeFrom: (amount) => `Gratuït a partir de ${amount}`,
    total: 'Total',
    taxes: 'Impostos inclosos',
    terms: 'He llegit i accepto les',
    termsLink: 'condicions de venda',
    and: 'i la',
    privacyLink: 'política de privacitat',
    pay: 'Paga amb targeta',
    redirecting: 'Et portem a la passarel·la de pagament segura…',
    secure: 'Pagament segur amb targeta a través de Redsys. No veiem ni desem mai les dades de la teva targeta.',
    emptyCart: 'La teva cistella és buida.',
    errors: {
      required: 'Aquest camp és obligatori.',
      email: 'Revisa el correu electrònic.',
      terms: 'Cal que acceptis les condicions de venda.',
      method: 'Tria un mètode d’enviament.',
      stock: 'Algun producte ja no té prou existències. Revisa la cistella.',
      generic: 'No hem pogut crear la comanda. Torna-ho a provar d’aquí a uns minuts.'
    },
    couponErrors: {
      invalid: 'Aquest codi no existeix.',
      expired: 'Aquest codi ha caducat.',
      notStarted: 'Aquest codi encara no està actiu.',
      exhausted: 'Aquest codi ja s’ha fet servir el màxim de vegades.',
      minimum: (amount) => `Aquest codi és vàlid a partir de ${amount}.`
    }
  },
  order: {
    title: (n) => `Comanda ${n}`,
    thanks: 'Gràcies per la teva compra!',
    paidText: 'Hem rebut el pagament. T’hem enviat la confirmació per correu i t’avisarem quan enviem la comanda.',
    pendingTitle: 'Estem confirmant el pagament',
    pendingText: 'Pot trigar uns segons. Aquesta pàgina s’actualitza sola.',
    failedTitle: 'El pagament no s’ha completat',
    failedText: 'No s’ha fet cap càrrec. Pots tornar-ho a provar quan vulguis.',
    retry: 'Torna a provar el pagament',
    items: 'Articles',
    shipTo: 'Enviament a',
    pickup: 'Recollida',
    tracking: 'Seguiment de l’enviament',
    status: 'Estat',
    date: 'Data',
    letter: 'Lletra',
    idea: 'Idea',
    statuses: {
      pending_payment: 'Pendent de pagament',
      paid: 'Pagada',
      preparing: 'En preparació',
      shipped: 'Enviada',
      delivered: 'Lliurada',
      cancelled: 'Cancel·lada',
      refunded: 'Reemborsada'
    }
  },
  payLink: {
    title: 'La teva personalització està a punt per pagar',
    intro: 'La Laura i la Paula han revisat la teva sol·licitud. Comprova el resum, tria l’enviament i paga de manera segura.',
    message: 'Missatge de Lau&Pau',
    expired: 'Aquest enllaç de pagament ha caducat. Escriu-nos i te n’enviarem un de nou.',
    paid: 'Aquesta comanda ja està pagada. Gràcies!',
    validUntil: (d) => `Enllaç vàlid fins al ${d}.`
  },
  accountPages: {
    title: 'El meu compte',
    login: 'Inicia la sessió',
    loginCta: 'Entra',
    register: 'Crea un compte',
    registerCta: 'Crea el meu compte',
    noAccount: 'Encara no tens compte?',
    hasAccount: 'Ja tens compte?',
    forgot: 'Has oblidat la contrasenya?',
    email: 'Correu electrònic',
    password: 'Contrasenya',
    passwordHelp: 'Mínim 10 caràcters.',
    newPassword: 'Contrasenya nova',
    currentPassword: 'Contrasenya actual',
    name: 'Nom',
    phone: 'Telèfon',
    logout: 'Tanca la sessió',
    orders: 'Comandes',
    requests: 'Sol·licituds',
    addresses: 'Adreces',
    details: 'Les meves dades',
    noOrders: 'Encara no has fet cap comanda.',
    noRequests: 'No tens sol·licituds de personalització.',
    noAddresses: 'No tens adreces desades.',
    view: 'Veure',
    pay: 'Paga',
    save: 'Desa',
    saved: 'Canvis desats.',
    delete: 'Elimina',
    addAddress: 'Afegeix una adreça',
    label: 'Nom de l’adreça (casa, feina…)',
    default: 'Predeterminada',
    makeDefault: 'Fes-la predeterminada',
    recoverTitle: 'Recupera la contrasenya',
    recoverText: 'Escriu el teu correu i t’enviarem un enllaç per crear una contrasenya nova.',
    recoverCta: 'Envia l’enllaç',
    recoverSent: 'Si hi ha un compte amb aquest correu, t’hem enviat un enllaç. Revisa també la carpeta de correu brossa.',
    resetTitle: 'Crea una contrasenya nova',
    resetCta: 'Desa la contrasenya',
    resetInvalid: 'Aquest enllaç no és vàlid o ha caducat. Demana’n un de nou.',
    resetDone: 'Contrasenya actualitzada. Ja pots entrar.',
    changePassword: 'Canvia la contrasenya',
    errors: {
      credentials: 'El correu o la contrasenya no són correctes.',
      exists: 'Ja hi ha un compte amb aquest correu. Inicia la sessió o recupera la contrasenya.',
      password: 'La contrasenya ha de tenir almenys 10 caràcters.',
      current: 'La contrasenya actual no és correcta.',
      tooMany: 'Massa intents. Espera uns minuts.',
      required: 'Completa els camps obligatoris.'
    },
    requestStatuses: {
      new: 'Rebuda',
      quoted: 'Pendent de pagament',
      paid: 'Pagada',
      rejected: 'No disponible',
      expired: 'Caducada'
    }
  },
  about: {
    eyebrow: 'Dues amigues, un projecte',
    p: [
      'Som la Laura i la Paula, dues amigues i sòcies amb molts anys d’experiència en el comerç. Vam crear Lau&Pau per donar forma a un projecte que parlés de nosaltres: del que ens agrada, de la nostra manera d’entendre les tendències i del valor que donem als petits detalls.',
      'La Paula és la part més inquieta i creativa del projecte. És darrere de la selecció de productes, les idees noves, les personalitzacions i el dia a dia de Lau&Pau.',
      'La Laura aporta la nostra mirada a les tendències. Sempre atenta al que ve i a aquells detalls capaços de transformar un accessori, el seu criteri ens ajuda a triar què volem que formi part de la marca.',
      'Des d’Andorra, combinem creativitat, experiència i proximitat per oferir accessoris i detalls amb personalitat. Darrere de cada selecció, cada personalització i cada comanda hi som nosaltres.'
    ],
    signoff: 'La Laura i la Paula. Encantades de formar part dels teus petits detalls.',
    philTitle: 'Tendència, personalitat i petits detalls',
    phil: [
      'A Lau&Pau fem les coses amb il·lusió i amb criteri. Ens agrada descobrir productes diferents, estar atentes a les tendències i seleccionar allò que realment ens agrada i que creiem que també et pot agradar a tu.',
      'Creiem que una cosa senzilla pot convertir-se en una cosa especial. Una lletra, un accessori o un detall triat pensant en algú poden dir molt.',
      'Treballem de manera propera, cuidant cada selecció i cada comanda com ens agradaria que ho fessin per a nosaltres. Volem que hi trobis una marca bonica i amb personalitat, amb persones de debò a l’altra banda.'
    ],
    values: [
      ['Seleccionem amb criteri', 'Productes que ens agraden i que encaixen amb la nostra manera d’entendre les tendències.'],
      ['Cuidem els detalls', 'Petits gestos i opcions de personalització que aporten significat.'],
      ['Som a prop', 'La Laura i la Paula, darrere de les idees, les consultes i les comandes.']
    ]
  },
  personalize: {
    eyebrow: 'Personalització',
    note: 'Revisem cada sol·licitud i et confirmem les opcions i el preu final, amb qualsevol possible suplement, abans que paguis res.',
    fullSheet: 'Veure la fitxa completa'
  },
  drawer: {
    title: 'La teva cistella',
    close: 'Tanca la cistella',
    empty: 'La cistella és buida. Fes una ullada a la selecció i troba el teu proper caprici.',
    emptyCta: 'Descobreix els productes',
    checkout: 'Finalitza la compra',
    viewCart: 'Veure tota la cistella',
    note: 'Enviament i descomptes al pas següent.',
    items: (n) => (n === 1 ? '1 article' : `${n} articles`),
    dragHint: 'Llisca cap avall per tancar'
  },
  marquee: ['Petits detalls', 'Molt de tu', 'La teva inicial', 'El teu detall', 'Des d’Andorra'],
  menuClose: 'Tanca el menú',
  heroChip: 'Veure el detall',
  notFound: {
    title: 'No trobem aquesta pàgina',
    text: 'Potser l’enllaç ha canviat. Torna a l’inici o fes una ullada al catàleg.',
    home: 'Ves a l’inici',
    products: 'Veure els productes'
  }
};

const dicts: Record<Lang, Dict> = { es, ca };

export function t(lang: Lang): Dict {
  return dicts[lang] ?? es;
}
