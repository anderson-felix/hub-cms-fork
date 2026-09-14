type FuncType = (grades: string[]) => string[];

export const sortGrades: FuncType = (grades) => {
  const lowest: string[] = [];
  const fund: string[] = [];
  const highest: string[] = [];

  grades.forEach((g) => (g.toLocaleLowerCase().endsWith(`em`) ? highest.push(g) : !isNaN(Number(g)) ? fund.push(g) : lowest.push(g)));

  return [...sorting(lowest), ...sorting(fund), ...sorting(highest)];
};

const sorting: FuncType = (grades) =>
  grades.sort((a, b) =>
    isNaN(Number(a))
      ? isNaN(parseInt(a.match(/\d+/g)?.join(``) || ``, 10))
        ? -1
        : parseInt(a.match(/\d+/g)?.join(``) || ``, 10) - parseInt(b.match(/\d+/g)?.join(``) || ``, 10) || 1
      : Number(a) - Number(b),
  );
