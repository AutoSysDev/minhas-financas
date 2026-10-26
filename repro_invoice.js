
// Mock helper functions
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

const calculateCurrentInvoiceAmount = (
  card,
  transactions,
  targetDate = new Date()
) => {
  const closingDay = Number(card.closingDay) || 1;
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth();

  // Se o dia atual for maior que o fechamento, a fatura atual é do mês seguinte
  const closingThisMonth = new Date(currentYear, currentMonth, closingDay, 23, 59, 59, 999);

  let closingDate;
  if (targetDate > closingThisMonth) {
    closingDate = new Date(currentYear, currentMonth + 1, closingDay, 23, 59, 59, 999);
  } else {
    closingDate = closingThisMonth;
  }

  const startDate = new Date(closingDate);
  startDate.setMonth(startDate.getMonth() - 1);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(0, 0, 0, 0);

  console.log('--- Calculation Debug ---');
  console.log('Target Date:', targetDate.toISOString());
  console.log('Closing Day:', closingDay);
  console.log('Closing Date:', closingDate.toISOString());
  console.log('Start Date:', startDate.toISOString());

  return transactions.reduce((acc, t) => {
    if (t.cardId !== card.id) return acc;

    const tDate = getTransactionDate(t.date);
    // console.log(`Transaction ${t.description}: Date=${tDate.toISOString()} Amount=${t.amount} Type=${t.type}`);

    if (tDate >= startDate && tDate <= closingDate) {
      // console.log('  -> INCLUDED');
      if (t.type === 'EXPENSE') return acc + Number(t.amount);
      if (t.type === 'INCOME') return acc - Number(t.amount);
    } else {
      // console.log('  -> EXCLUDED');
    }

    return acc;
  }, 0);
};

// Test Data
const today = new Date('2026-01-28T10:00:00'); // Environment date
const card = {
  id: 'card1',
  closingDay: 20,
  name: 'Test Card'
};

const transactions = [
  {
    id: 't1',
    description: 'Expense inside range',
    amount: 100,
    date: '2026-01-25', // Should be included (Jan 21 - Feb 20)
    type: 'EXPENSE',
    cardId: 'card1'
  },
  {
    id: 't2',
    description: 'Expense outside range (past)',
    amount: 50,
    date: '2026-01-15', // Should be excluded (Dec 21 - Jan 20)
    type: 'EXPENSE',
    cardId: 'card1'
  },
  {
    id: 't3',
    description: 'Expense ISO inside range',
    amount: 75.50,
    date: '2026-01-26T15:30:00.000Z', // Should be included
    type: 'EXPENSE',
    cardId: 'card1'
  },
  {
    id: 't4',
    description: 'Income inside range',
    amount: 20,
    date: '2026-02-01', // Should be included
    type: 'INCOME',
    cardId: 'card1'
  }
];

const fs = require('fs');

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync('repro_output.txt', msg + '\n');
  {
    id: 't5',
      description: 'Space format',
        amount: 10,
          date: '2026-01-26 15:30:00', // Might fail
            type: 'EXPENSE',
              cardId: 'card1'
  }
];

const result = calculateCurrentInvoiceAmount(card, transactions, today);
log('Result: ' + result);
