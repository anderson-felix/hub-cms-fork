type FuncType = (name: string | number) => string;

export const formatReadableId: FuncType = readable_id =>
  `${readable_id}`.padStart(5, '0');
