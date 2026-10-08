export type ProjectAsset = { src: string; client: string; kind: 'image' | 'video' };
export type Project = { id: string; assets: ProjectAsset[] };

const images = (names: string[]): ProjectAsset[] => names.map(name => ({
  src: `/img/${name}.webp`,
  client:
    name.startsWith('EXO') ? 'EXO ENVIRONMENTAL' :
    name.startsWith('GRO') ? 'GROAQUA' :
    name.startsWith('IGOR') ? 'IGOR KISALEV' :
    name.startsWith('MV') ? 'MARVIVA' :
    name.startsWith('QW') ? 'SUNY OLD WESTBURY' :
    name.startsWith('SPM') ? 'SPERM WHALES DOMINICA' :
    name.startsWith('VHL') ? 'VALHALLA' :
    name.startsWith('WWF') ? 'WWF PERU' :
    name.startsWith('WW') ? 'WEWHALE' :
    name.startsWith('SOA') ? 'SUSTAINABLE OCEAN ALLIANCE' : '',
  kind: 'image',
}));

export const projects: Project[] = [
  {
    id: '01',
    assets: images([
      'EXO1','EXO2','EXO3','EXO4',
      'GRO','GRO2','GRO3',
      'IGOR1','IGOR2','IGOR3'
    ]),
  },
  {
    id: '02',
    assets: images([
      'DOLPH','GUITA','GUITA2','MR','SHARK1','SHARK2',
      'MV1','MV2','MV3',
      'QW1','QW2','QW3','SPM2','SPM3'
    ]),
  },
  {
    id: '03',
    assets: images([
      'REEF','RH','SOA2',
      'VHL_1','VHL_2','VHL_3',
      'WW_DOLPH1','WW_DOLPH2','WW_DOLPH3',
      'WW2_1','WW2_2','WW2_3',
      'WW3_1','WW3_2','WW3_3',
      'WWF_B1','WWF_B2','WWF_B3',
      'WWF_OMI1','WWF_OMI2','WWF_OMI3',
      'WWF_T1','WWF_T2','WWF_T3',
      'WWF_TB1','WWF_TB2','WWF_TB3'
    ]),
  },
  {
    id: '04',
    assets: [
      { src: '/videos/havida.webm', client: 'HAVIDA', kind: 'video' },
      ...Array.from({ length: 9 }, (_, i) => ({ src: `/videos/${i + 1}.webm`, client: '', kind: 'video' as const })),
    ],
  },
];
// Accessible labels describe the work, never an internal asset/gallery index.
export function projectAssetLabel(asset: ProjectAsset, project: Project): string {
  if (asset.client) return asset.client;
  const labels: Record<string, string> = {
    '01': 'Technical visualization project',
    '02': 'Scientific illustration project',
    '03': 'Educational illustration project',
    '04': 'Animation and video project',
  };
  return labels[project.id] || 'Visual communication project';
}
