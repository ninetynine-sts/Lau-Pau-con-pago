/**
 * Piezas de marca del diseño original: la «&» trazada, el corazón de cristal,
 * el precio tipográfico y las definiciones SVG compartidas.
 */
import type { CSSProperties } from 'react';
import { ArrowRight, ArrowUpRight, Plus, Check } from '@phosphor-icons/react/dist/ssr';

export const AMP_PATH =
  'M1256 -22Q1403 -22 1506 33Q1609 89 1662 197Q1716 305 1716 463Q1716 645 1650 818Q1585 990 1466 1127Q1331 1284 1151 1378Q972 1472 767 1472Q570 1472 427 1410Q284 1348 208 1239Q131 1130 131 989Q131 886 171 832Q212 778 281 778Q329 778 360 810Q391 842 391 890Q391 928 380 956Q370 985 358 1013Q345 1040 335 1072Q325 1105 325 1150Q325 1244 374 1313Q424 1382 522 1421Q620 1459 763 1459Q966 1459 1143 1366Q1319 1273 1451 1120Q1571 982 1637 810Q1702 638 1702 462Q1702 323 1663 232Q1625 140 1556 95Q1488 50 1395 50Q1319 50 1255 81Q1191 112 1125 182Q1059 252 975 370Q910 461 867 556Q823 650 801 752Q779 853 779 966Q779 1085 821 1160Q864 1235 920 1235Q967 1235 988 1173Q1010 1111 1010 1013Q1010 906 979 833Q949 760 897 721Q845 682 780 676L783 667Q917 673 1015 713Q1114 754 1168 827Q1222 900 1222 1001Q1222 1076 1186 1134Q1150 1192 1086 1224Q1023 1257 939 1257Q817 1257 729 1203Q641 1149 593 1054Q546 959 546 836Q546 750 563 656Q580 562 619 464Q658 365 724 265Q796 159 879 96Q963 33 1057 6Q1152 -22 1256 -22ZM1114 178 1118 170Q1288 242 1375 350Q1463 457 1463 584Q1463 665 1423 707Q1383 749 1329 749Q1272 749 1234 713Q1196 678 1196 631Q1196 597 1207 569Q1219 541 1230 510Q1241 479 1241 433Q1241 400 1229 355Q1218 309 1190 263Q1162 216 1114 178ZM585 650 584 659Q434 653 329 605Q224 557 170 476Q116 394 116 287Q116 147 209 62Q302 -22 471 -22Q575 -22 651 -4Q726 15 782 46Q838 78 882 118L875 137Q837 107 785 87Q732 67 656 67Q526 67 455 146Q384 225 384 368Q384 437 408 499Q432 561 477 602Q522 643 585 650Z';

export const HEART_PATH =
  'M50.01 93.91C50.32 93.82 50.93 93.77 51.55 93.4C52.18 93.04 52.37 93.01 53.79 91.73C55.21 90.44 57.16 88.72 60.08 85.71C63 82.7 67.29 78.23 71.3 73.65C75.31 69.08 81.32 61.9 84.16 58.26C87.01 54.62 87.35 53.26 88.36 51.82C89.37 50.37 89.21 51.1 90.21 49.58C91.21 48.05 93.22 44.66 94.34 42.66C95.47 40.66 96.18 39.35 96.98 37.56C97.79 35.78 98.69 33.89 99.19 31.95C99.69 30.01 99.9 28.02 99.97 25.93C100.04 23.83 99.77 20.98 99.62 19.38C99.46 17.79 99.53 17.73 99.02 16.34C98.52 14.95 97.77 12.85 96.59 11.04C95.41 9.23 93.57 6.97 91.92 5.47C90.27 3.98 88.07 2.82 86.7 2.07C85.34 1.32 85.36 1.32 83.74 0.98C82.12 0.64 79.39 0.09 76.99 0.01C74.59 -0.07 71.1 0.29 69.36 0.51C67.62 0.74 67.81 0.86 66.55 1.37C65.29 1.88 63.19 2.73 61.79 3.57C60.39 4.42 59.24 5.46 58.14 6.46C57.03 7.46 56.33 8.11 55.16 9.6C53.98 11.08 51.87 14.33 51.08 15.37C50.28 16.41 50.65 15.85 50.37 15.83C50.09 15.82 50.54 16.63 49.41 15.28C48.28 13.92 45.5 9.7 43.59 7.71C41.69 5.72 39.82 4.45 37.98 3.33C36.13 2.22 34.44 1.58 32.54 1.04C30.63 0.51 28.06 0.29 26.54 0.13C25.01 -0.04 24.91 -0.05 23.4 0.03C21.89 0.11 19.36 0.16 17.48 0.59C15.6 1.02 13.72 1.79 12.14 2.6C10.55 3.4 9.29 4.27 7.99 5.42C6.68 6.57 5.27 8.2 4.32 9.5C3.37 10.79 2.94 11.8 2.28 13.19C1.62 14.58 0.74 16 0.37 17.85C-0.01 19.7 -0.07 22.04 0.03 24.29C0.14 26.54 0.38 28.86 1 31.35C1.63 33.84 2.59 36.66 3.77 39.22C4.94 41.77 5.97 43.43 8.05 46.67C10.13 49.91 13.81 55.35 16.24 58.66C18.68 61.97 18.68 62.06 22.64 66.53C26.6 71.01 35.77 81.08 40.01 85.5C44.26 89.92 46.48 91.66 48.09 93.06C49.71 94.46 49.36 93.76 49.68 93.9C50 94.04 49.7 93.99 50.01 93.91Z';

const HEART_PATH_UNIT =
  'M0.5001 0.99915C0.5032 0.99819 0.5093 0.99766 0.5155 0.99372C0.5218 0.98989 0.5237 0.98957 0.5379 0.97595C0.5521 0.96223 0.5716 0.94393 0.6008 0.91191C0.63 0.87988 0.6729 0.83232 0.713 0.78359C0.7531 0.73497 0.8132 0.65858 0.8416 0.61985C0.8701 0.58113 0.8735 0.56666 0.8836 0.55134C0.8937 0.53591 0.8921 0.54367 0.9021 0.5275C0.9121 0.51122 0.9322 0.47516 0.9434 0.45388C0.9547 0.4326 0.9618 0.41866 0.9698 0.39962C0.9779 0.38068 0.9869 0.36057 0.9919 0.33993C0.9969 0.31929 0.999 0.29812 0.9997 0.27588C1.0004 0.25354 0.9977 0.22322 0.9962 0.20619C0.9946 0.18928 0.9953 0.18864 0.9902 0.17385C0.9852 0.15906 0.9777 0.13672 0.9659 0.11746C0.9541 0.0982 0.9357 0.07416 0.9192 0.0582C0.9027 0.04234 0.8807 0.03 0.867 0.02202C0.8534 0.01404 0.8536 0.01404 0.8374 0.01043C0.8212 0.00681 0.7939 0.00096 0.7699 0.00011C0.7459 -0.00074 0.711 0.00309 0.6936 0.00543C0.6762 0.00787 0.6781 0.00915 0.6655 0.01458C0.6529 0.02 0.6319 0.02905 0.6179 0.03798C0.6039 0.04703 0.5924 0.05809 0.5814 0.06873C0.5703 0.07937 0.5633 0.08629 0.5516 0.10214C0.5398 0.11788 0.5187 0.15246 0.5108 0.16353C0.5028 0.17459 0.5065 0.16863 0.5037 0.16842C0.5009 0.16832 0.5054 0.17693 0.4941 0.16257C0.4828 0.1481 0.455 0.1032 0.4359 0.08203C0.4169 0.06086 0.3982 0.04735 0.3798 0.03543C0.3613 0.02362 0.3444 0.01681 0.3254 0.01107C0.3063 0.00543 0.2806 0.00309 0.2654 0.00138C0.2501 -0.00043 0.2491 -0.00053 0.234 0.00032C0.2189 0.00117 0.1936 0.0017 0.1748 0.00628C0.156 0.01085 0.1372 0.01904 0.1214 0.02766C0.1055 0.03617 0.0929 0.04543 0.0799 0.05767C0.0668 0.0699 0.0527 0.08724 0.0432 0.10107C0.0337 0.1148 0.0294 0.12555 0.0228 0.14033C0.0162 0.15512 0.0074 0.17023 0.0037 0.18991C-0.0001 0.2096 -0.0007 0.23449 0.0003 0.25843C0.0014 0.28237 0.0038 0.30705 0.01 0.33355C0.0163 0.36004 0.0259 0.39004 0.0377 0.41728C0.0494 0.44441 0.0597 0.46207 0.0805 0.49654C0.1013 0.53101 0.1381 0.58889 0.1624 0.62411C0.1868 0.65933 0.1868 0.66028 0.2264 0.70784C0.266 0.75551 0.3577 0.86264 0.4001 0.90967C0.4426 0.9567 0.4648 0.97521 0.4809 0.99011C0.4971 1.005 0.4936 0.99755 0.4968 0.99904C0.5 1.00053 0.497 1 0.5001 0.99915Z';

export function Amp({ className = '', solid = false }: { className?: string; solid?: boolean }) {
  return (
    <svg
      className={`lp-amp${solid ? ' lp-amp--solid' : ''}${className ? ` ${className}` : ''}`}
      viewBox="116 -1472 1600 1494"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="scale(1,-1)">
        <path d={AMP_PATH} style={{ '--len': 16065 } as CSSProperties} />
      </g>
    </svg>
  );
}

/** Definiciones compartidas por todos los corazones (recortes y degradados del cristal). */
export function SvgDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }} focusable="false">
      <defs>
        <clipPath id="lp-heart-clip">
          <path d={HEART_PATH} />
        </clipPath>
        <clipPath id="lp-heart-clip-u" clipPathUnits="objectBoundingBox">
          <path d={HEART_PATH_UNIT} />
        </clipPath>
        <linearGradient id="lp-glass-body" x1="0" y1="0" x2=".3" y2="1">
          <stop offset="0" stopColor="#C4AD93" />
          <stop offset=".5" stopColor="#A58B71" />
          <stop offset="1" stopColor="#7E6650" />
        </linearGradient>
        <linearGradient id="lp-glass-bevel" x1=".12" y1="0" x2=".88" y2="1">
          <stop offset="0" stopColor="#FFF8EE" stopOpacity=".8" />
          <stop offset=".34" stopColor="#FFFFFF" stopOpacity=".1" />
          <stop offset=".62" stopColor="#5C4435" stopOpacity=".2" />
          <stop offset="1" stopColor="#FFF8EE" stopOpacity=".5" />
        </linearGradient>
        <radialGradient id="lp-glass-spec" cx="30%" cy="18%" r="26%">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset=".6" stopColor="#fff" stopOpacity=".18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lp-glass-hot" cx="26%" cy="13%" r="5%">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lp-glass-caustic" cx="60%" cy="74%" r="32%">
          <stop offset="0" stopColor="#F6E6C7" stopOpacity=".7" />
          <stop offset="1" stopColor="#F6E6C7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lp-glass-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F3EBDF" />
          <stop offset=".45" stopColor="#B9A088" />
          <stop offset=".72" stopColor="#7E6650" />
          <stop offset="1" stopColor="#D9C8B2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Corazón de cristal colgante. La física y el volumen los monta components/effects.tsx. */
export function Heart({ size, thread }: { size: number; thread: number }) {
  return (
    <span className="lp-heart" style={{ '--size': `${size}px`, '--thread': `${thread}px` } as CSSProperties}>
      <svg className="lp-heart__rope" aria-hidden="true" focusable="false">
        <path />
      </svg>
      <span className="lp-heart__hang">
        <span className="lp-heart__bail">
          <svg viewBox="0 0 26 32" aria-hidden="true" focusable="false">
            <ellipse cx="13" cy="13" rx="8.4" ry="10" fill="none" stroke="url(#lp-glass-metal)" strokeWidth="3.1" />
            <ellipse cx="13" cy="10" rx="8.4" ry="10" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".8" />
          </svg>
        </span>
        <span className="lp-heart__scene" />
      </span>
    </span>
  );
}

export function Hearts({ set }: { set: [number, number][] }) {
  return (
    <div className="lp-hearts" data-hearts aria-hidden="true">
      {set.map(([size, thread], i) => (
        <Heart key={i} size={size} thread={thread} />
      ))}
    </div>
  );
}

const AMBIENT = [
  { side: 'left', pos: '3.5%', size: 18, thread: 54, base: 0.08, par: 0.1 },
  { side: 'right', pos: '4.5%', size: 14, thread: 40, base: 0.34, par: 0.19 },
  { side: 'left', pos: '6%', size: 22, thread: 66, base: 0.58, par: 0.14 },
  { side: 'right', pos: '3%', size: 16, thread: 46, base: 0.78, par: 0.08 },
  { side: 'left', pos: '2.5%', size: 15, thread: 38, base: 0.95, par: 0.22 },
  { side: 'right', pos: '6.5%', size: 20, thread: 58, base: 0.18, par: 0.16 }
] as const;

export function Ambient() {
  return (
    <div className="lp-ambient" data-ambient aria-hidden="true">
      {AMBIENT.map((a, i) => (
        <span
          key={i}
          className="lp-ambient__piece"
          style={
            {
              [a.side]: a.pos,
              '--size': `${a.size}px`,
              '--thread': `${a.thread}px`,
              '--base': a.base,
              '--par': a.par
            } as CSSProperties
          }
        >
          <span className="lp-ambient__thread" />
          <span className="lp-heart__scene" />
        </span>
      ))}
    </div>
  );
}

export function Loader() {
  return (
    <div className="lp-loader" data-loader aria-hidden="true">
      <Amp className="lp-loader__amp" />
    </div>
  );
}

/** Plantilla que reutilizan la transición entre páginas y los cargadores de foto. */
export function AmpTemplate() {
  // El contenido de <template> no forma parte del DOM: se inyecta como HTML para que
  // la hidratación de React no intente compararlo.
  const html = `<svg class="lp-amp" viewBox="116 -1472 1600 1494" fill="none" aria-hidden="true" focusable="false"><g transform="scale(1,-1)"><path d="${AMP_PATH}" style="--len:16065"/></g></svg>`;
  return <template data-amp-template dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />;
}

/** Precio con el símbolo pequeño en ámbar y los céntimos en superíndice. */
export function Price({ cents, size = 'md', lang = 'es' }: { cents: number; size?: 'sm' | 'md' | 'lg' | 'xl'; lang?: 'es' | 'ca' }) {
  const int = Math.trunc(cents / 100);
  const dec = String(Math.abs(cents % 100)).padStart(2, '0');
  const label = new Intl.NumberFormat(lang === 'ca' ? 'ca-ES' : 'es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  return (
    <span className={`lp-price lp-price--${size}`}>
      <span className="lp-visually-hidden">{label}</span>
      <span className="cur" aria-hidden="true">
        €
      </span>
      <span className="int" aria-hidden="true">
        {int.toLocaleString(lang === 'ca' ? 'ca-ES' : 'es-ES')}
      </span>
      <span className="dec" aria-hidden="true">
        ,{dec}
      </span>
    </span>
  );
}

/** Antes era un barrido de brillo; se retira por sobriedad. Se mantiene para no tocar cada botón. */
export function Sheen() {
  return null;
}

/** Icono anidado al final de un botón: vive en su propio círculo. */
export function BtnIcon({ kind = 'arrow' }: { kind?: 'arrow' | 'up' | 'plus' | 'check' }) {
  const Icon = kind === 'up' ? ArrowUpRight : kind === 'plus' ? Plus : kind === 'check' ? Check : ArrowRight;
  return (
    <span className="lp-btn__icon" aria-hidden="true">
      <Icon size={17} weight="regular" />
    </span>
  );
}
