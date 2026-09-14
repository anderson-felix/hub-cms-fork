export const coursePageViewOptions = <const>[`course`, `module`, `module_lesson`];
export type CoursePageViewType = (typeof coursePageViewOptions)[number];

export const coursePageViewLabelMapper: Record<CoursePageViewType, string> = {
  course: 'Cursos',
  module: `Módulos`,
  module_lesson: `Atividades do módulo`,
};
