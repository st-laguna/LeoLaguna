export type ProjectAsset = { src: string; client: string; kind: 'image' | 'video' };
export type Project = { id: string; assets: ProjectAsset[] };
const images = (folder: string, names: string[]): ProjectAsset[] => names.map(name => ({
  src: `/imgs/projects/${folder}/${name}.webp`,
  client: name.startsWith('GRO') ? 'GROAQUA' : name.startsWith('EXO') ? 'EXO ENVIRONMENTAL' : '',
  kind: 'image',
}));
// Orden de imágenes: la primera abre la categoría; las primeras nueve forman la cuadrícula 3 × 3.
// Edita client para completar los créditos reales de cada imagen.
export const projects: Project[] = [
  {
    id: '01',
    assets: images('01', [
      'GRO', 'EXO1', 'EXO2', 'EXO3', 'GRO3',
      'IGOR1', 'EXO4', 'IGOR3', 'QW1', 'QW3',
    ]),
  },
  {
    id: '02',
    assets: images('02', [
      'WW2_1', 'MV1', 'MV2', 'MV3', 'SPM1',
      'SPM2', '14', '15', '16', '18',
    ]),
  },
  {
    id: '03',
    assets: images('03', [
      '1', '13', '14', '15', '16',
      '27', '4', '6', '7', '8',
    ]),
  },
  {
  id: '04',
  assets: [
    { src: '/videos/havida.webm', client: 'HAVIDA', kind: 'video' },
    ...Array.from({ length: 9 }, (_, i) => ({
      src: `/videos/${i + 1}.webm`,
      client: '',
      kind: 'video' as const,
    })),
  ],
},
];
// Añade aquí otros dos videos cuando existan. No se solicitan rutas inexistentes.
