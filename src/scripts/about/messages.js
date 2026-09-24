const es = {
  'Loading my little world…': 'Cargando mi pequeño mundo…',
  'Preparing the 3D scene…': 'Preparando la escena 3D…',
  'Back to the full scene.': 'De vuelta a la escena completa.',
  'Ready to explore.': 'Listo para explorar.',
  'Play motion': 'Activar movimiento', 'Pause motion': 'Pausar movimiento',
  'The 3D scene is taking a little longer. You can keep reading.': 'La escena 3D está tardando un poco más. Puedes seguir leyendo.',
  'The 3D scene is unavailable. All contact links still work.': 'La escena 3D no está disponible. Los enlaces de contacto siguen funcionando.',
  'Some details could not load. You can still explore the scene.': 'Algunos detalles no se han cargado. Puedes seguir explorando la escena.',
  'The 3D view is unavailable on this browser. You can still read about me and get in touch.': 'La vista 3D no está disponible en este navegador. Puedes seguir leyendo sobre mí y contactarme.',
  'The 3D view was interrupted. Reload to try again.': 'La vista 3D se ha interrumpido. Recarga para volver a intentarlo.',
  '3D view restored.': 'Vista 3D restablecida.',
  'Laptop': 'Portátil', 'Artwork': 'Ilustración', 'Book I': 'Libro I', 'Book II': 'Libro II',
  'My quieter companion.': 'Mi compañero más tranquilo.', 'Always on the move.': 'Siempre en movimiento.',
  'Marine biologist. Visual communicator.': 'Biólogo marino. Comunicador visual.',
  'Where ideas take shape.': 'Donde las ideas toman forma.', 'From a quick sketch to the final detail.': 'Del primer boceto al último detalle.',
  'A little piece of my visual world.': 'Un pedacito de mi mundo visual.', 'Always something more to learn.': 'Siempre hay algo más que aprender.', 'Another source of inspiration.': 'Otra fuente de inspiración.'
};
export function message(text) {
  if (document.documentElement.lang !== 'es') return text;
  if (text.startsWith('Inspecting ')) return 'Explorando ' + message(text.slice(11));
  return es[text] || text;
}
