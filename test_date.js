
const getTransactionDate = (dateStr) => {
  if (!dateStr) return new Date();

  // Formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
  if (dateStr.includes('-')) {
    const cleanDateStr = dateStr.split('T')[0];
    const [year, month, day] = cleanDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date();
};

const date1 = '2024-01-26';
const date2 = '2024-01-26T14:30:00';

console.log('Date 1:', getTransactionDate(date1).toString());
console.log('Date 2:', getTransactionDate(date2).toString());
