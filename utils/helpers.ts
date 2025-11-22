
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatDate = (dateString: string): string => {
  // Assume YYYY-MM-DD input or keep as is if already formatted
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
  }
  return dateString;
};
