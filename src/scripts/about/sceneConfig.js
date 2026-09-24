// Adjust the look in one place. All sizes are world units except pixelSize.
export const SCENE = {
  background: '#e0e0e0',
  pixelSize: 3,
  renderScale: 0.85,
  mobileRenderScale: 0.75,
  minRenderScale: 0.6,
  maxRenderPixels: 2100000,
  maxFPS: 60,
  hoverFPS: 20,
  camera: [0, 3, 3],
  overview: [0, 8, 16],
  target: [0, 1.2, 0],
  distortion: 0.2,
  chroma: 0.01,
  // null uses the matching decoder bundled by Three/Vite, served from your own site.
  dracoPath: null,
};

// Matches the previous effective placement, without moving individual GLB parts.
export const PROPS = [
  {
    id: 'laptop',
    label: 'Laptop',
    description: 'Where ideas take shape.',
    position: [3, 2.4, 2],
  },
  {
    id: 'ipad',
    label: 'iPad',
    description: 'From a quick sketch to the final detail.',
    position: [-3, 2.4, 2],
  },
  {
    id: 'cuadro',
    label: 'Artwork',
    description: 'A little piece of my visual world.',
    position: [3, 2.4, -2],
  },
  {
    id: 'libro1',
    label: 'Book I',
    description: 'Always something more to learn.',
    position: [-3, 2.4, -2],
  },
  {
    id: 'libro2',
    label: 'Book II',
    description: 'Another source of inspiration.',
    position: [0, 2.4, 3.6],
  },
];
