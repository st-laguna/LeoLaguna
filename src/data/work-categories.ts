export const categoryKeys = {
  technical:'projects.01.title', scientific:'projects.02.title',
  educational:'projects.03.title', animation:'projects.04.title',
} as const;
export type WorkCategory = keyof typeof categoryKeys;
