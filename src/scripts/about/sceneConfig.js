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

// Canonical personal objects for both desktop and the anatomical wheel.
// Characters, halos and gem belong to the surrounding scene, not this catalog.
export const PROPS = [
  {
    "id": "laptop",
    "model": "/about/models/laptop.glb",
    "image": "/about/img/PC_PIC.webp",
    "title": "ONE MORE UPGRADE",
    "text": "My PC has been upgraded so many times that very little of the original one is probably left. I spend a lot of time working here, so over the years I’ve tried to turn the whole setup into a place I actually like being in.",
    "position": [
      -1.55,
      2.1,
      -1
    ],
    "editorialPosition": [
      -1.55,
      2.1,
      -1
    ],
    "sceneSize": 0.7,
    "rotation": [
      0,
      3.141592653589793,
      0
    ]
  },
  {
    "id": "book",
    "model": "/about/models/libro1.glb",
    "image": "/about/img/BOOK_PIC.webp",
    "title": "OFFLINE REFERENCES",
    "text": "I’m starting to keep more books around the studio, mostly photography and scientific illustration. I like having references that don’t disappear the second I close a browser tab.",
    "position": [
      -0.75,
      2.4,
      -1.5
    ],
    "editorialPosition": [
      -0.75,
      2.4,
      -1.5
    ],
    "sceneSize": 0.7,
    "rotation": [
      1.0471975511965976,
      0,
      0
    ]
  },
  {
    "id": "ipad",
    "model": "/about/models/ipad.glb",
    "image": "/about/img/IPAD_PIC.webp",
    "title": "PEN & SCREEN",
    "text": "Not everything I make is 3D. I started with illustration, and I still draw pretty often just because I feel like it. The iPad is usually where ideas get to exist without needing a reason.",
    "position": [
      0.2,
      2.5,
      -1.8
    ],
    "editorialPosition": [
      0.2,
      2.5,
      -1.8
    ],
    "sceneSize": 0.7,
    "rotation": [
      1.0471975511965976,
      0,
      0
    ]
  },
  {
    "id": "painting",
    "model": "/about/models/cuadro2.glb",
    "image": "/about/img/PAINT_PIC.webp",
    "title": "NO EMPTY WALLS",
    "text": "I love art, so empty walls don’t last very long around me. Most of my studio is covered with work from artists I admire, especially scientific illustrators, and a few of my own pieces have slowly made their way in too.",
    "position": [
      1.1,
      2.3,
      -1.5
    ],
    "editorialPosition": [
      1.1,
      2.3,
      -1.5
    ],
    "sceneSize": 0.7,
    "rotation": [
      1.5707963267948966,
      0,
      0
    ]
  },
  {
    "id": "controller",
    "model": "/about/models/mando.glb",
    "image": "/about/img/GAMING_PIC.webp",
    "title": "GAME BREAK",
    "text": "Games are one of the things I enjoy when I’m done working. Sometimes I just want to sit down, grab a controller and do something that has absolutely nothing to do with a deadline.",
    "position": [
      1.6,
      1.8,
      -1
    ],
    "editorialPosition": [
      1.6,
      1.8,
      -1
    ],
    "sceneSize": 0.7,
    "rotation": [
      0,
      0,
      0
    ]
  },
  {
    "id": "luggage",
    "model": "/about/models/maleta.glb",
    "image": "/about/img/TRAVEL_PIC.webp",
    "title": "OUT OF LIMA",
    "text": "I really like traveling. New cities, new food, museums, different landscapes. Getting away for a while usually clears my head and somehow I always come back wanting to make something.",
    "position": [
      1.45,
      0.95,
      -0.5
    ],
    "editorialPosition": [
      1.45,
      0.95,
      -0.5
    ],
    "sceneSize": 0.7,
    "rotation": [
      0,
      0,
      0
    ]
  },
  {
    "id": "dog-bone",
    "model": "/about/models/hueso.glb",
    "image": "/about/img/DOG_PIC.webp",
    "title": "ALWAYS A DOG AROUND",
    "text": "There have always been dogs in my life, so having one nearby just feels normal to me. They have a strange talent for becoming part of every habit in the house, including the ones nobody invited them into.",
    "position": [
      -1.5,
      1.1,
      -0.5
    ],
    "editorialPosition": [
      -1.5,
      1.1,
      -0.5
    ],
    "sceneSize": 0.7,
    "rotation": [
      0,
      0,
      0
    ]
  }
];

// Focus zoom is an inverse-distance scale, not literal OrbitControls distance.
export const FOCUS = {
  referenceDistance: 7,
  leo: { minZoom: 3, maxZoom: 7, targetBone: 'spine2', targetOffsetY: .04 },
  object: { minZoom: 5, maxZoom: 10 },
};