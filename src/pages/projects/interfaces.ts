export const projectPageViewOptions = <const>[`projects`];
export type ProjectPageViewType = (typeof projectPageViewOptions)[number];

export const projectPageViewLabelMapper: Record<ProjectPageViewType, string> = {
  projects: 'Projetos',
};
