type FuncType = (grade: string) => string;

export const formatClassGrade: FuncType = (grade: string) =>
  isNaN(Number(grade))
    ? grade.toLocaleLowerCase().endsWith(`em`)
      ? `${grade.replace(/\D/g, '')}º ano - Ensino Médio`
      : `${grade}`
    : `${grade}º ano`;
