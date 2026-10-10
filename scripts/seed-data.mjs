/**
 * Datos iniciales: el catálogo de la web actual de Lau&Pau, traducido al catalán,
 * y unos métodos de envío de ejemplo que hay que revisar desde el panel.
 */

export const categories = [
  { id: 'textil', name: { es: 'Textil', ca: 'Tèxtil' }, sort: 1 },
  { id: 'accesorios', name: { es: 'Accesorios', ca: 'Accessoris' }, sort: 2 },
  { id: 'personalizacion', name: { es: 'Personalización', ca: 'Personalització' }, sort: 3 }
];

const img = (file, es, ca, width, height) => ({
  src: `/laupau/productos/${file}`,
  alt: { es, ca },
  width,
  height
});

export const products = [
  {
    slug: 'charm-estrella-personalizado',
    ref: 'lp-004',
    categoryId: 'personalizacion',
    featured: true,
    sort: 1,
    priceCents: 999,
    name: { es: 'Charm de estrella con letra personalizada', ca: "Charm d'estrella amb lletra personalitzada" },
    shortDescription: { es: 'Una letra con significado para ti.', ca: 'Una lletra amb significat per a tu.' },
    description: {
      es: 'Charm de estrella con una letra personalizada. Dinos qué inicial te gustaría: revisamos tu solicitud y te enviamos el precio final y el enlace de pago.',
      ca: "Charm d'estrella amb una lletra personalitzada. Digues-nos quina inicial t'agradaria: revisem la teva sol·licitud i t'enviem el preu final i l'enllaç de pagament."
    },
    badge: { es: 'Con tu letra', ca: 'Amb la teva lletra' },
    variants: [
      { name: { es: 'Marrón y camel', ca: 'Marró i camell' }, color: '#5A3324,#A8612B' }
    ],
    images: [img('charm-estrella-personalizado.webp',
      'Charm con estrella marrón, cordones y una letra P naranja como ejemplo de personalización.',
      'Charm amb estrella marró, cordons i una lletra P taronja com a exemple de personalització.', 1145, 1374)],
    personalization: {
      mode: 'letter',
      label: { es: '¿Qué letra quieres?', ca: 'Quina lletra vols?' },
      help: {
        es: 'Una sola letra; admite tildes y ñ. Te confirmamos acabados y posibles suplementos.',
        ca: "Una sola lletra; admet accents i ç. Et confirmem els acabats i els possibles suplements."
      }
    }
  },
  {
    slug: 'calcetines-glitter',
    ref: 'lp-001',
    categoryId: 'textil',
    sort: 2,
    priceCents: 499,
    name: { es: 'Calcetines glitter', ca: 'Mitjons glitter' },
    shortDescription: { es: 'Un toque de brillo para tus días de siempre.', ca: 'Un toc de brillantor per als teus dies de sempre.' },
    description: {
      es: 'Calcetines glitter para sumar un detalle diferente a tu look.',
      ca: 'Mitjons glitter per afegir un detall diferent al teu look.'
    },
    variants: [
      { name: { es: 'Crudo · «Indécise»', ca: 'Cru · «Indécise»' }, color: '#EFE8DA' },
      { name: { es: 'Camel · «Princesse»', ca: 'Camell · «Princesse»' }, color: '#8C6B47' },
      { name: { es: 'Azul · «Édition limitée»', ca: 'Blau · «Édition limitée»' }, color: '#2F4F94' },
      { name: { es: 'Granate · «Sexy»', ca: 'Granat · «Sexy»' }, color: '#8B1A26' },
      { name: { es: "Lavanda · «Tata d'amour»", ca: "Lavanda · «Tata d'amour»" }, color: '#C8BAC3' },
      { name: { es: 'Rosa · «La miss»', ca: 'Rosa · «La miss»' }, color: '#E58C93' }
    ],
    images: [img('calcetines-glitter.webp',
      'Calcetines glitter en seis colores y con distintos mensajes.',
      'Mitjons glitter en sis colors i amb missatges diferents.', 1224, 1285)]
  },
  {
    slug: 'panuelos',
    ref: 'lp-002',
    categoryId: 'accesorios',
    sort: 3,
    priceCents: 799,
    name: { es: 'Pañuelos', ca: 'Mocadors' },
    shortDescription: { es: 'Un nudo y otra forma de ver tu look.', ca: 'Un nus i una altra manera de veure el teu look.' },
    description: {
      es: 'Pañuelos con diferentes estampados para dar otro aire a tu conjunto.',
      ca: "Mocadors amb estampats diferents per donar un altre aire al teu conjunt."
    },
    variants: [
      { name: { es: 'Granate con rosas', ca: 'Granat amb roses' }, color: '#7C1521,#F1ECE6' },
      { name: { es: 'Teja con topitos', ca: 'Teula amb topets' }, color: '#8E2A1D,#D9C3A8' },
      { name: { es: 'Granate con flores rosas', ca: 'Granat amb flors roses' }, color: '#9C1C2C,#F1C3C8' },
      { name: { es: 'Blanco con lunares negros', ca: 'Blanc amb pics negres' }, color: '#F7F4EE,#151313' },
      { name: { es: 'Negro con lunares blancos', ca: 'Negre amb pics blancs' }, color: '#151313,#F7F4EE' },
      { name: { es: 'Blanco con tigre', ca: 'Blanc amb tigre' }, color: '#F6F1EA,#E9A27C' },
      { name: { es: 'Negro cachemir', ca: 'Negre caixmir' }, color: '#1A1514,#8A6A4F' },
      { name: { es: 'Marrón con lunares', ca: 'Marró amb pics' }, color: '#6A2D1E,#F5EFE6' }
    ],
    images: [img('panuelos.webp',
      'Selección de ocho pañuelos con estampados florales, geométricos y de lunares.',
      'Selecció de vuit mocadors amb estampats florals, geomètrics i de pics.', 1295, 1214)]
  },
  {
    slug: 'bolso-cierre-hueso',
    ref: 'lp-003',
    categoryId: 'accesorios',
    sort: 4,
    priceCents: 2499,
    name: { es: 'Bolso con cierre hueso', ca: "Bossa amb tancament d'os" },
    shortDescription: { es: 'El cierre que da personalidad al conjunto.', ca: 'El tancament que dona personalitat al conjunt.' },
    description: {
      es: 'Un bolso con un cierre protagonista para acompañar tus looks.',
      ca: 'Una bossa amb un tancament protagonista per acompanyar els teus looks.'
    },
    variants: [
      { name: { es: 'Cuero', ca: 'Cuir' }, color: '#B4602B' },
      { name: { es: 'Negro', ca: 'Negre' }, color: '#1F1C1B' },
      { name: { es: 'Marrón topo', ca: 'Marró talp' }, color: '#5F4C3D' },
      { name: { es: 'Mostaza', ca: 'Mostassa' }, color: '#E1AE30' },
      { name: { es: 'Granate', ca: 'Granat' }, color: '#8B2027' }
    ],
    images: [img('bolso-cierre-hueso.webp',
      'Bolso con cierre hueso mostrado en cinco colores.',
      "Bossa amb tancament d'os mostrada en cinc colors.", 1536, 1024)]
  },
  {
    slug: 'cordon-para-movil',
    ref: 'lp-005',
    categoryId: 'accesorios',
    sort: 5,
    priceCents: 999,
    name: { es: 'Cordón para móvil', ca: 'Cordó per al mòbil' },
    shortDescription: { es: 'Tu móvil, a tu lado.', ca: 'El teu mòbil, al teu costat.' },
    description: {
      es: 'Cordón para llevar el móvil contigo. Comprueba la compatibilidad con tu funda antes de realizar el pedido.',
      ca: 'Cordó per portar el mòbil amb tu. Comprova la compatibilitat amb la teva funda abans de fer la comanda.'
    },
    variants: [
      { name: { es: 'Azul y lila', ca: 'Blau i lila' }, color: '#7DB4E6,#7B4FD0' },
      { name: { es: 'Rosa y gris', ca: 'Rosa i gris' }, color: '#F2A29E,#5C5C60' },
      { name: { es: 'Azul y amarillo', ca: 'Blau i groc' }, color: '#5DB7E6,#E3E85A' }
    ],
    images: [img('cordon-para-movil.webp',
      'Tres cordones para móvil en sus embalajes originales, con distintas combinaciones de color.',
      'Tres cordons per al mòbil en els seus embalatges originals, amb diferents combinacions de color.', 1536, 1024)]
  },
  {
    slug: 'manta-polar-personalizable',
    ref: 'lp-006',
    categoryId: 'personalizacion',
    sort: 6,
    priceCents: 1999,
    name: { es: 'Manta polar de 130 × 170 cm', ca: 'Manta polar de 130 × 170 cm' },
    shortDescription: { es: 'Un detalle acogedor para bajar el ritmo.', ca: 'Un detall acollidor per baixar el ritme.' },
    description: {
      es: 'Manta polar de 130 × 170 cm. Cuéntanos cómo te gustaría personalizarla: revisamos tu idea y te enviamos el precio final y el enlace de pago.',
      ca: "Manta polar de 130 × 170 cm. Explica'ns com t'agradaria personalitzar-la: revisem la teva idea i t'enviem el preu final i l'enllaç de pagament."
    },
    badge: { es: 'A tu idea', ca: 'A la teva idea' },
    details: [{ label: { es: 'Medidas', ca: 'Mides' }, value: { es: '130 × 170 cm', ca: '130 × 170 cm' } }],
    variants: [
      { name: { es: 'Beige', ca: 'Beix' }, color: '#DCCAB5' }
    ],
    images: [img('manta-polar-personalizable.webp',
      'Manta polar beige doblada, con el nombre PAULA en la fotografía de referencia.',
      'Manta polar beix plegada, amb el nom PAULA a la fotografia de referència.', 1391, 1131)],
    personalization: {
      mode: 'idea',
      maxLength: 300,
      label: { es: 'Cuéntanos cómo te gustaría personalizarla', ca: "Explica'ns com t'agradaria personalitzar-la" },
      help: {
        es: 'Un nombre, una fecha, una frase… Revisamos tu idea y te confirmamos opciones y precio.',
        ca: 'Un nom, una data, una frase… Revisem la teva idea i et confirmem opcions i preu.'
      }
    }
  }
];

/**
 * Métodos de envío de EJEMPLO: zonas y precios sin confirmar. El panel muestra un aviso
 * hasta que alguien los revisa y guarda (ajuste shippingReviewed).
 */
export const shippingMethods = [
  {
    name: { es: 'Recogida en Andorra', ca: 'Recollida a Andorra' },
    description: { es: 'Te avisamos cuando tu pedido esté listo.', ca: 'T’avisem quan la teva comanda estigui a punt.' },
    countries: ['AD'], allCountries: false, isPickup: true, priceCents: 0, freeOverCents: null, sort: 1
  },
  {
    name: { es: 'Envío a domicilio en Andorra', ca: 'Enviament a domicili a Andorra' },
    description: { es: '', ca: '' },
    countries: ['AD'], allCountries: false, isPickup: false, priceCents: 400, freeOverCents: 5000, sort: 2
  },
  {
    name: { es: 'Envío a España', ca: 'Enviament a Espanya' },
    description: { es: '', ca: '' },
    countries: ['ES'], allCountries: false, isPickup: false, priceCents: 800, freeOverCents: null, sort: 3
  }
];

export const settings = {
  storeEmail: 'comercial@exitekta.ad',
  notifyEmail: 'comercial@exitekta.ad',
  instagram: 'lau.and.pau',
  paymentLinkDays: 7,
  shippingReviewed: false
};
