/**
 * Colección de octubre de 2026: productos nuevos con sus fotos (recortadas de las piezas
 * de Instagram, sin textos ni precios) y los colores tal como se ven en ellas.
 * Las tiendas ya creadas los reciben una sola vez al arrancar (ver scripts/migrate.mjs).
 */

export const COLLECTION_KEY = 'catalog-2026-10';

export const newCategories = [
  { id: 'papeleria-hogar', name: { es: 'Papelería y hogar', ca: 'Papereria i llar' }, sort: 4 }
];

const img = (file, es, ca, width, height) => ({ src: `/laupau/productos/${file}`, alt: { es, ca }, width, height });
const c = (es, ca, color) => ({ name: { es, ca }, color });

// Estampados compartidos por neceseres y monedero.
const prints = [
  c('Leopardo crudo', 'Lleopard cru', '#ccae9d,#3a251a'),
  c('Leopardo chocolate', 'Lleopard xocolata', '#6f4230,#29140c'),
  c('Leopardo camel', 'Lleopard camell', '#a07152,#351e11'),
  c('Lunares', 'Pics', '#e6d4c3,#1d1a19')
];
const stripes = [
  c('Lila y morado', 'Lila i morat', '#ea84bd,#6c4392'),
  c('Verde y menta', 'Verd i menta', '#83c4ae,#366141'),
  c('Rosa y granate', 'Rosa i granat', '#fa6391,#7d252c')
];

export const newProducts = [
  {
    slug: 'bolso-piel-hebilla-dorada',
    ref: 'lp-007',
    categoryId: 'accesorios',
    featured: true,
    sort: 7,
    priceCents: 7999,
    name: { es: 'Bolso de piel con hebilla dorada', ca: 'Bossa de pell amb sivella daurada' },
    shortDescription: { es: 'Piel natural y detalles dorados.', ca: 'Pell natural i detalls daurats.' },
    description: {
      es: 'Bolso de piel natural con cierre de hebilla dorada y asas redondas. Amplio y práctico, con bolsillo interior con cremallera: el compañero elegante para el día a día.',
      ca: "Bossa de pell natural amb tancament de sivella daurada i nanses rodones. Àmplia i pràctica, amb butxaca interior amb cremallera: la companya elegant per al dia a dia."
    },
    details: [{ label: { es: 'Material', ca: 'Material' }, value: { es: 'Piel natural', ca: 'Pell natural' } }],
    variants: [c('Camel', 'Camell', '#9a5a2e'), c('Choco', 'Xoco', '#4a332b')],
    images: [
      img('bolso-piel-hebilla-1.webp', 'Bolso de piel con hebilla dorada en camel y choco.', 'Bossa de pell amb sivella daurada en camell i xoco.', 1312, 705),
      img('bolso-piel-hebilla-2.webp', 'Bolso de piel camel llevado al brazo.', 'Bossa de pell camell portada al braç.', 859, 950),
      img('bolso-piel-hebilla-3.webp', 'Bolso de piel camel con un look vaquero.', 'Bossa de pell camell amb un look texà.', 342, 580),
      img('bolso-piel-hebilla-4.webp', 'Interior del bolso con bolsillo con cremallera.', 'Interior de la bossa amb butxaca amb cremallera.', 317, 580),
      img('bolso-piel-hebilla-5.webp', 'Detalle de la hebilla dorada y la piel.', 'Detall de la sivella daurada i la pell.', 351, 580)
    ]
  },
  {
    slug: 'bolso-piel-mediano',
    ref: 'lp-008',
    categoryId: 'accesorios',
    sort: 8,
    priceCents: 3999,
    name: { es: 'Bolso de piel mediano', ca: 'Bossa de pell mitjana' },
    shortDescription: { es: 'Piel auténtica hecha en Italia.', ca: 'Pell autèntica feta a Itàlia.' },
    description: {
      es: 'Bolso mediano de piel auténtica, hecho en Italia. Con asas cortas y bandolera para llevarlo a mano o cruzado.',
      ca: 'Bossa mitjana de pell autèntica, feta a Itàlia. Amb nanses curtes i bandolera per portar-la a la mà o creuada.'
    },
    details: [{ label: { es: 'Material', ca: 'Material' }, value: { es: 'Piel auténtica · Made in Italy', ca: 'Pell autèntica · Made in Italy' } }],
    variants: [c('Burdeos', 'Bordeus', '#5e1f26'), c('Choco', 'Xoco', '#4a3229'), c('Camel', 'Camell', '#a85f30'), c('Negro', 'Negre', '#232121')],
    images: [img('bolso-piel-mediano-1.webp', 'Bolso de piel mediano en burdeos, choco, camel y negro.', 'Bossa de pell mitjana en bordeus, xoco, camell i negre.', 1254, 979)]
  },
  {
    slug: 'gomas-pelo-pack-3',
    ref: 'lp-009',
    categoryId: 'accesorios',
    sort: 9,
    priceCents: 599,
    name: { es: 'Gomas de pelo · pack de 3', ca: 'Gomes de cabell · pack de 3' },
    shortDescription: { es: 'Tres gomas a juego para cada día.', ca: 'Tres gomes a joc per a cada dia.' },
    description: {
      es: 'Pack de tres gomas de pelo trenzadas con cuenta, en combinaciones de colores pensadas para llevarlas juntas en el pelo o en la muñeca.',
      ca: "Pack de tres gomes de cabell trenades amb bola, en combinacions de colors pensades per portar-les juntes al cabell o al canell."
    },
    details: [{ label: { es: 'Contenido', ca: 'Contingut' }, value: { es: '3 gomas', ca: '3 gomes' } }],
    variants: [
      c('Negro y plata', 'Negre i plata', '#181513,#a9a9ad'),
      c('Fucsia y lila', 'Fúcsia i lila', '#9c3a5c,#581626'),
      c('Rosa empolvado', 'Rosa empolsat', '#e6b1ac,#b9796d'),
      c('Verde botella', 'Verd ampolla', '#3d4e3f,#0d1810'),
      c('Frambuesa', 'Gerd', '#8c1342,#440416'),
      c('Rosa y lila', 'Rosa i lila', '#a25274,#d0a8ae'),
      c('Teja', 'Teula', '#ad6949,#612610'),
      c('Mostaza', 'Mostassa', '#b47e2c,#592d0f'),
      c('Blanco y negro', 'Blanc i negre', '#161514,#efefef'),
      c('Rosa y chocolate', 'Rosa i xocolata', '#a56b65,#4b1f1a'),
      c('Malva', 'Malva', '#caa4a2,#87556a'),
      c('Cobre', 'Coure', '#aa6f5b,#572519')
    ],
    images: [
      img('gomas-pelo-1.webp', 'Tres gomas de pelo trenzadas en tonos fucsia y lila.', 'Tres gomes de cabell trenades en tons fúcsia i lila.', 416, 552),
      img('gomas-pelo-2.webp', 'Las doce combinaciones de gomas de pelo.', 'Les dotze combinacions de gomes de cabell.', 1254, 526),
      img('gomas-pelo-3.webp', 'Gomas de pelo puestas en una coleta.', 'Gomes de cabell posades en una cua.', 425, 722)
    ]
  },
  {
    slug: 'neceser-mediano',
    ref: 'lp-010',
    categoryId: 'accesorios',
    sort: 10,
    priceCents: 899,
    name: { es: 'Neceser mediano', ca: 'Necesser mitjà' },
    shortDescription: { es: 'Práctico, versátil y con mucho estilo.', ca: 'Pràctic, versàtil i amb molt estil.' },
    description: {
      es: 'Neceser mediano de pana con cremallera, borla y etiqueta «Amour». Ligero y resistente, ideal para el bolso, el viaje o para regalar.',
      ca: 'Necesser mitjà de pana amb cremallera, borla i etiqueta «Amour». Lleuger i resistent, ideal per a la bossa, el viatge o per regalar.'
    },
    variants: prints,
    images: [img('neceser-mediano-1.webp', 'Neceser mediano en leopardo crudo, chocolate, camel y lunares.', 'Necesser mitjà en lleopard cru, xocolata, camell i pics.', 1122, 708)]
  },
  {
    slug: 'monedero',
    ref: 'lp-011',
    categoryId: 'accesorios',
    sort: 11,
    priceCents: 699,
    name: { es: 'Monedero', ca: 'Moneder' },
    shortDescription: { es: 'Práctico, ligero y con mucho estilo.', ca: 'Pràctic, lleuger i amb molt estil.' },
    description: {
      es: 'Monedero de pana con cremallera, borla y etiqueta «Amour». De tamaño ideal para el bolso, en varios estampados.',
      ca: 'Moneder de pana amb cremallera, borla i etiqueta «Amour». De mida ideal per a la bossa, en diversos estampats.'
    },
    variants: prints,
    images: [img('monedero-1.webp', 'Monedero en leopardo crudo, chocolate, camel y lunares.', 'Moneder en lleopard cru, xocolata, camell i pics.', 1052, 643)]
  },
  {
    slug: 'neceser-corazon',
    ref: 'lp-012',
    categoryId: 'accesorios',
    sort: 12,
    priceCents: 899,
    name: { es: 'Neceser corazón', ca: 'Necesser cor' },
    shortDescription: { es: 'Práctico, original y con mucho estilo.', ca: 'Pràctic, original i amb molt estil.' },
    description: {
      es: 'Neceser con forma de corazón, de pana, con «Amour» bordado en dorado y borla. Un detalle original para llevar o para regalar.',
      ca: 'Necesser en forma de cor, de pana, amb «Amour» brodat en daurat i borla. Un detall original per portar o per regalar.'
    },
    variants: prints,
    images: [img('neceser-corazon-1.webp', 'Neceser corazón en leopardo crudo, chocolate, camel y lunares.', 'Necesser cor en lleopard cru, xocolata, camell i pics.', 1124, 696)]
  },
  {
    slug: 'libreta-grande-rayas',
    ref: 'lp-013',
    categoryId: 'papeleria-hogar',
    sort: 13,
    priceCents: 1099,
    name: { es: 'Libreta grande de rayas', ca: 'Llibreta gran de ratlles' },
    shortDescription: { es: 'Espacio para tus ideas.', ca: 'Espai per a les teves idees.' },
    description: {
      es: 'Libreta grande de tapa dura con rayas de colores y goma de cierre. Resistente y elegante, ideal para el día a día o para regalar.',
      ca: 'Llibreta gran de tapa dura amb ratlles de colors i goma de tancament. Resistent i elegant, ideal per al dia a dia o per regalar.'
    },
    variants: stripes,
    images: [img('libreta-grande-rayas-1.webp', 'Libretas grandes de rayas en lila, verde y rosa.', 'Llibretes grans de ratlles en lila, verd i rosa.', 1212, 597)]
  },
  {
    slug: 'libreta-pequena-rayas',
    ref: 'lp-014',
    categoryId: 'papeleria-hogar',
    sort: 14,
    priceCents: 799,
    name: { es: 'Libreta pequeña de rayas', ca: 'Llibreta petita de ratlles' },
    shortDescription: { es: 'Práctica, elegante y siempre a mano.', ca: 'Pràctica, elegant i sempre a mà.' },
    description: {
      es: 'Libreta pequeña de tapa dura con rayas de colores y goma de cierre. De tamaño ideal para llevarla siempre en el bolso.',
      ca: 'Llibreta petita de tapa dura amb ratlles de colors i goma de tancament. De mida ideal per portar-la sempre a la bossa.'
    },
    variants: stripes,
    images: [img('libreta-pequena-rayas-1.webp', 'Libretas pequeñas de rayas en lila, verde y rosa.', 'Llibretes petites de ratlles en lila, verd i rosa.', 1152, 556)]
  },
  {
    slug: 'libreta-rayas-boligrafo',
    ref: 'lp-015',
    categoryId: 'papeleria-hogar',
    sort: 15,
    priceCents: 899,
    name: { es: 'Libreta de rayas con bolígrafo', ca: 'Llibreta de ratlles amb bolígraf' },
    shortDescription: { es: 'Práctica y con mucho estilo.', ca: 'Pràctica i amb molt estil.' },
    description: {
      es: 'Libreta alargada de espiral con rayas de colores y bolígrafo dorado sujeto en la tapa. Perfecta para listas y notas rápidas.',
      ca: 'Llibreta allargada d’espiral amb ratlles de colors i bolígraf daurat subjecte a la tapa. Perfecta per a llistes i notes ràpides.'
    },
    variants: stripes,
    images: [img('libreta-rayas-boli-1.webp', 'Libretas de espiral de rayas con bolígrafo dorado.', 'Llibretes d’espiral de ratlles amb bolígraf daurat.', 1000, 686)]
  },
  {
    slug: 'libreta-colores-boligrafo',
    ref: 'lp-016',
    categoryId: 'papeleria-hogar',
    sort: 16,
    priceCents: 899,
    name: { es: 'Libreta de colores con bolígrafo', ca: 'Llibreta de colors amb bolígraf' },
    shortDescription: { es: 'Un mensaje bonito en cada color.', ca: 'Un missatge bonic a cada color.' },
    description: {
      es: 'Libreta alargada de espiral en tonos pastel, con mensaje en la tapa y bolígrafo dorado. Elige tu favorita: «Dream», «Smile» o «Noti».',
      ca: 'Llibreta allargada d’espiral en tons pastel, amb missatge a la tapa i bolígraf daurat. Tria la teva preferida: «Dream», «Smile» o «Noti».'
    },
    variants: [c('Rosa · «Dream»', 'Rosa · «Dream»', '#f5aba8'), c('Amarillo · «Smile»', 'Groc · «Smile»', '#f2d899'), c('Lila · «Noti»', 'Lila · «Noti»', '#c5afd5')],
    images: [
      img('libreta-colores-1.webp', 'Libretas de colores rosa, amarilla y lila con bolígrafo dorado.', 'Llibretes de colors rosa, groga i lila amb bolígraf daurat.', 1252, 860),
      img('libreta-colores-2.webp', 'Libreta amarilla «Smile» junto a la taza Smile.', 'Llibreta groga «Smile» al costat de la tassa Smile.', 1030, 704)
    ]
  },
  {
    slug: 'taza-smile',
    ref: 'lp-017',
    categoryId: 'papeleria-hogar',
    sort: 17,
    priceCents: 599,
    name: { es: 'Taza Smile', ca: 'Tassa Smile' },
    shortDescription: { es: 'Colores que alegran tu día.', ca: 'Colors que alegren el teu dia.' },
    description: {
      es: 'Taza de cerámica con el smile de «Coffee time» y el asa en otro color. Un diseño alegre para empezar el día, o para regalar.',
      ca: 'Tassa de ceràmica amb el somriure de «Coffee time» i la nansa d’un altre color. Un disseny alegre per començar el dia, o per regalar.'
    },
    details: [{ label: { es: 'Material', ca: 'Material' }, value: { es: 'Cerámica', ca: 'Ceràmica' } }],
    variants: [c('Lila', 'Lila', '#c7a6d4'), c('Amarillo', 'Groc', '#f6ec8a'), c('Verde agua', 'Verd aigua', '#4bb3a1')],
    images: [
      img('taza-smile-1.webp', 'Tazas Smile en lila, amarillo y verde agua.', 'Tasses Smile en lila, groc i verd aigua.', 1254, 596),
      img('taza-smile-2.webp', 'Taza Smile lila con café junto a una libreta.', 'Tassa Smile lila amb cafè al costat d’una llibreta.', 1030, 704)
    ]
  },
  {
    slug: 'llavero-resina-perrito',
    ref: 'lp-018',
    categoryId: 'accesorios',
    sort: 18,
    priceCents: 999,
    name: { es: 'Llavero de resina perrito', ca: 'Clauer de resina gosset' },
    shortDescription: { es: 'Original, divertido y con mucho estilo.', ca: 'Original, divertit i amb molt estil.' },
    description: {
      es: 'Llavero con perrito de resina, perla, borla negra y mosquetón dorado. Para las llaves o para colgar del bolso.',
      ca: 'Clauer amb gosset de resina, perla, borla negra i mosquetó daurat. Per a les claus o per penjar de la bossa.'
    },
    variants: [
      c('Teckel', 'Teckel', '#462b1e,#e6ded6'),
      c('Bulldog francés', 'Bulldog francès', '#775942,#1a110b'),
      c('Chihuahua crema', 'Chihuahua crema', '#efe5da,#a27b61'),
      c('Perrito negro', 'Gosset negre', '#12100f,#efebe7'),
      c('Chihuahua negro', 'Chihuahua negre', '#24201d,#d6baa1')
    ],
    images: [
      img('llavero-resina-1.webp', 'Cinco llaveros de resina con perritos distintos.', 'Cinc clauers de resina amb gossets diferents.', 1536, 680),
      img('llavero-resina-2.webp', 'Llavero de resina teckel sobre madera.', 'Clauer de resina teckel sobre fusta.', 900, 1360)
    ]
  },
  {
    slug: 'llavero-piel-perrito',
    ref: 'lp-019',
    categoryId: 'accesorios',
    sort: 19,
    priceCents: 699,
    name: { es: 'Llavero de piel perrito', ca: 'Clauer de pell gosset' },
    shortDescription: { es: 'Elegante, resistente y atemporal.', ca: 'Elegant, resistent i atemporal.' },
    description: {
      es: 'Llavero de piel natural con silueta de perrito y mosquetón dorado. Duradero y ligero, un detalle ideal para regalar.',
      ca: 'Clauer de pell natural amb silueta de gosset i mosquetó daurat. Durador i lleuger, un detall ideal per regalar.'
    },
    details: [{ label: { es: 'Material', ca: 'Material' }, value: { es: 'Piel natural', ca: 'Pell natural' } }],
    variants: [c('Rojo', 'Vermell', '#b5241a'), c('Topo', 'Talp', '#ad9f90'), c('Camel', 'Camell', '#b4652d'), c('Negro', 'Negre', '#191511')],
    images: [img('llavero-piel-1.webp', 'Llaveros de piel con forma de perrito en rojo, topo, camel y negro.', 'Clauers de pell en forma de gosset en vermell, talp, camell i negre.', 1200, 580)]
  },
  {
    slug: 'fular-fino-cashmere',
    ref: 'lp-020',
    categoryId: 'textil',
    sort: 20,
    priceCents: 1299,
    name: { es: 'Fular fino de cashmere', ca: 'Fular fi de caixmir' },
    shortDescription: { es: 'Suave, ligero y elegante.', ca: 'Suau, lleuger i elegant.' },
    description: {
      es: 'Fular fino de cashmere, suave al tacto y ligero. Abriga sin pesar y combina con todo: elige entre once colores.',
      ca: 'Fular fi de caixmir, suau al tacte i lleuger. Abriga sense pesar i combina amb tot: tria entre onze colors.'
    },
    variants: [
      c('Negro', 'Negre', '#151515'),
      c('Crudo', 'Cru', '#efe5d6'),
      c('Gris oscuro', 'Gris fosc', '#3b3a3f'),
      c('Topo', 'Talp', '#9b8576'),
      c('Azul jeans', 'Blau texà', '#465064'),
      c('Marrón', 'Marró', '#6e3d26'),
      c('Azul claro', 'Blau clar', '#6e7f91'),
      c('Teja', 'Teula', '#954730'),
      c('Verde oliva', 'Verd oliva', '#5e563f'),
      c('Gris', 'Gris', '#9e9c9f'),
      c('Burdeos', 'Bordeus', '#781d22')
    ],
    images: [
      img('fular-cashmere-1.webp', 'Fular fino de cashmere en color topo.', 'Fular fi de caixmir de color talp.', 762, 912),
      img('fular-cashmere-2.webp', 'Los once colores del fular fino de cashmere.', 'Els onze colors del fular fi de caixmir.', 772, 662),
      img('fular-cashmere-3.webp', 'Fular topo sobre un banco de madera.', 'Fular talp sobre un banc de fusta.', 900, 1200)
    ]
  },
  {
    slug: 'capucha-punto',
    ref: 'lp-021',
    categoryId: 'textil',
    sort: 21,
    priceCents: 1299,
    name: { es: 'Capucha de punto', ca: 'Caputxa de punt' },
    shortDescription: { es: 'Cómoda, calentita y versátil.', ca: 'Còmoda, calenteta i versàtil.' },
    description: {
      es: 'Capucha de punto canalé con cuello y cordón para ajustarla. Suave al tacto, ideal para el frío y fácil de combinar.',
      ca: 'Caputxa de punt canalé amb coll i cordó per ajustar-la. Suau al tacte, ideal per al fred i fàcil de combinar.'
    },
    variants: [
      c('Negro', 'Negre', '#1d1b19'),
      c('Beige', 'Beix', '#d0b59e'),
      c('Gris oscuro', 'Gris fosc', '#403e3f'),
      c('Topo', 'Talp', '#7a5d4b'),
      c('Crudo', 'Cru', '#ece2d3'),
      c('Marrón', 'Marró', '#3c241e')
    ],
    images: [
      img('capucha-punto-1.webp', 'Capucha de punto marrón puesta.', 'Caputxa de punt marró posada.', 549, 826),
      img('capucha-punto-2.webp', 'Los seis colores de la capucha de punto.', 'Els sis colors de la caputxa de punt.', 586, 544),
      img('capucha-punto-3.webp', 'Capucha de punto marrón, vista de cerca.', 'Caputxa de punt marró, vista de prop.', 357, 525),
      img('capucha-punto-4.webp', 'Detalle del cuello y el cordón de la capucha.', 'Detall del coll i el cordó de la caputxa.', 357, 493)
    ]
  }
];
