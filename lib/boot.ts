/**
 * Script en línea del <head>. Va antes de pintar:
 *  - «lp-js»: hay JavaScript, así que las apariciones pueden empezar ocultas;
 *  - «lp-seen»: en la misma sesión no se repite la pantalla de carga;
 *  - red de seguridad: si algo falla, a los 4 s todo queda visible.
 */
export const BOOT =
  "(function(){var d=document.documentElement;d.className+=' lp-js';try{if(sessionStorage.getItem('lp-visto'))d.className+=' lp-seen'}catch(e){}setTimeout(function(){d.classList.add('lp-ready');[].forEach.call(document.querySelectorAll('.lp-reveal'),function(n){if(n.getBoundingClientRect().top<innerHeight)n.setAttribute('data-visible','true')})},4000)})();";
