import { supabase } from './supabase';
import { Transaction, TransactionType } from '../types';
import {
  lastDayOfMonth,
  monthKeyFromDate,
  monthKeyFromParts,
  occurrenceDate,
  previousMonthEnd,
  isRepetitionTransaction,
} from '../utils/fixedExpenses';

export type FixedDeleteMode = 'single' | 'future' | 'end';

const nowIso = () => new Date().toISOString();

export const mapTransactionRow = (row: any): Transaction => ({
  id: row.id,
  description: row.description,
  amount: Number(row.amount || 0),
  date: row.date,
  type: row.type,
  category: row.category,
  cardId: row.card_id || undefined,
  accountId: row.account_id || undefined,
  isPaid: Boolean(row.is_paid),
  installments: row.installments ?? undefined,
  installmentNumber: row.installment_number ?? undefined,
  originalTransactionId: row.original_transaction_id || undefined,
  isFixed: Boolean(row.fixed_expense_id),
  fixedExpenseId: row.fixed_expense_id || undefined,
  fixedMonth: row.fixed_month || undefined,
});

const parseDateParts = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
};

const mapUpdatesToDb = (updates: Partial<Transaction>) => {
  const db: any = {};
  if (updates.description !== undefined) db.description = updates.description;
  if (updates.amount !== undefined) db.amount = updates.amount;
  if (updates.date !== undefined) db.date = updates.date;
  if (updates.type !== undefined) db.type = updates.type;
  if (updates.category !== undefined) db.category = updates.category;
  if (updates.isPaid !== undefined) db.is_paid = updates.isPaid;
  if (updates.accountId !== undefined) db.account_id = updates.accountId || null;
  if (updates.cardId !== undefined) db.card_id = updates.cardId || null;
  return db;
};

const deactivateFixedExpense = async (userId: string, fixedExpenseId: string, endDate: string) => {
  const { error } = await supabase
    .from('fixed_expenses')
    .update({ is_active: false, end_date: endDate, updated_at: nowIso() })
    .eq('id', fixedExpenseId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
};

const getFutureUnpaidIds = async (fixedExpenseId: string, month: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('fixed_expense_id', fixedExpenseId)
    .gt('fixed_month', month)
    .eq('is_paid', false);

  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => row.id);
};

export const fixedExpenseService = {
  /** Cria a despesa fixa e o lançamento do mês escolhido. */
  async createFixedExpense(userId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction[]> {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (transaction.type !== TransactionType.EXPENSE) {
      throw new Error('Despesa fixa só pode ser criada para despesas.');
    }
    if (transaction.installments && transaction.installments > 1) {
      throw new Error('Despesa fixa não pode ser parcelada.');
    }

    const { day } = parseDateParts(transaction.date);
    const fixedMonth = monthKeyFromDate(transaction.date);

    const { data: template, error: templateError } = await supabase
      .from('fixed_expenses')
      .insert({
        user_id: userId,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category || null,
        account_id: transaction.accountId || null,
        card_id: transaction.cardId || null,
        day_of_month: day,
        start_date: transaction.date,
      })
      .select()
      .single();

    if (templateError || !template) {
      throw new Error(templateError?.message || 'Não foi possível criar a despesa fixa.');
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type: TransactionType.EXPENSE,
        category: transaction.category || null,
        card_id: transaction.cardId || null,
        account_id: transaction.accountId || null,
        is_paid: transaction.isPaid ?? true,
        installments: null,
        installment_number: null,
        fixed_expense_id: template.id,
        fixed_month: fixedMonth,
      })
      .select();

    if (error) {
      await supabase.from('fixed_expenses').delete().eq('id', template.id).eq('user_id', userId);
      throw new Error(error.message);
    }

    // Se a despesa começou em um mês passado, garante também a ocorrência do mês atual.
    const now = new Date();
    const currentMonth = monthKeyFromParts(now.getFullYear(), now.getMonth());
    if (fixedMonth < currentMonth) {
      try {
        await fixedExpenseService.ensureForMonth(userId, now.getFullYear(), now.getMonth());
      } catch (ensureError) {
        console.error('Erro ao gerar a ocorrência do mês atual da despesa fixa:', ensureError);
      }
    }

    return (data || []).map(mapTransactionRow);
  },

  /**
   * Garante que exista uma ocorrência por despesa fixa ativa no mês.
   * Não recria meses excluídos individualmente (registro de exceção).
   */
  async ensureForMonth(userId: string, year: number, monthIndex: number): Promise<number> {
    if (!userId) return 0;

    const month = monthKeyFromParts(year, monthIndex);
    const monthEnd = lastDayOfMonth(year, monthIndex);

    const { data: templates, error: templatesError } = await supabase
      .from('fixed_expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (templatesError) throw new Error(templatesError.message);

    const active = (templates || []).filter(
      (template: any) =>
        template.start_date <= monthEnd &&
        (!template.end_date || template.end_date >= month)
    );

    if (active.length === 0) return 0;

    const { data: skips, error: skipsError } = await supabase
      .from('fixed_expense_skips')
      .select('fixed_expense_id')
      .eq('user_id', userId)
      .eq('month', month);

    if (skipsError) throw new Error(skipsError.message);

    const skipped = new Set((skips || []).map((row: any) => row.fixed_expense_id));

    // Ocorrências que já existem no mês não precisam ser recriadas.
    const { data: existing, error: existingError } = await supabase
      .from('transactions')
      .select('fixed_expense_id')
      .eq('user_id', userId)
      .eq('fixed_month', month)
      .not('fixed_expense_id', 'is', null);

    if (existingError) throw new Error(existingError.message);

    const existingIds = new Set((existing || []).map((row: any) => row.fixed_expense_id));

    const rows = active
      .filter((template: any) => !skipped.has(template.id) && !existingIds.has(template.id))
      .map((template: any) => {
        const date = occurrenceDate(year, monthIndex, template.day_of_month);
        if (date < template.start_date) return null;
        if (template.end_date && date > template.end_date) return null;

        return {
          user_id: userId,
          description: template.description,
          amount: template.amount,
          date,
          type: TransactionType.EXPENSE,
          category: template.category || null,
          card_id: template.card_id || null,
          account_id: template.account_id || null,
          is_paid: false,
          installments: null,
          installment_number: null,
          fixed_expense_id: template.id,
          fixed_month: month,
        };
      })
      .filter(Boolean);

    if (rows.length === 0) return 0;

    const { data, error } = await supabase
      .from('transactions')
      .upsert(rows, {
        onConflict: 'fixed_expense_id,fixed_month',
        ignoreDuplicates: true,
      })
      .select();

    if (error) throw new Error(error.message);
    return data?.length || 0;
  },

  /** Atualiza uma ocorrência e mantém as futuras em sincronia. */
  async updateFixedExpense(
    userId: string,
    transactionId: string,
    oldRow: any,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    const db = mapUpdatesToDb(updates);
    const fixedExpenseId = oldRow.fixed_expense_id as string | undefined;

    if (Object.keys(db).length === 0 && updates.isFixed === undefined) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw new Error(error.message);
      return mapTransactionRow(data);
    }

    // Desmarcou "Despesa fixa": encerra a repetição e mantém este mês como despesa normal.
    if (updates.isFixed === false) {
      if (fixedExpenseId) {
        const endDate = previousMonthEnd(oldRow.fixed_month || monthKeyFromDate(oldRow.date));
        await deactivateFixedExpense(userId, fixedExpenseId, endDate);
        await supabase
          .from('transactions')
          .delete()
          .eq('fixed_expense_id', fixedExpenseId)
          .gt('fixed_month', oldRow.fixed_month)
          .eq('is_paid', false);
      }

      db.fixed_expense_id = null;
      db.fixed_month = null;

      const { data, error } = await supabase
        .from('transactions')
        .update(db)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return mapTransactionRow(data);
    }

    // Já é fixa: atualiza esta ocorrência, o modelo e as futuras ainda não pagas.
    if (fixedExpenseId) {
      if (updates.date !== undefined && monthKeyFromDate(updates.date) !== oldRow.fixed_month) {
        throw new Error('Para despesa fixa, altere apenas o dia dentro do mesmo mês.');
      }

      const { data: template, error: templateError } = await supabase
        .from('fixed_expenses')
        .select('*')
        .eq('id', fixedExpenseId)
        .eq('user_id', userId)
        .single();

      if (templateError || !template) {
        throw new Error(templateError?.message || 'Despesa fixa não encontrada.');
      }

      const { data, error } = Object.keys(db).length > 0
        ? await supabase
            .from('transactions')
            .update(db)
            .eq('id', transactionId)
            .select()
            .single()
        : await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

      if (error) throw new Error(error.message);

      const templateUpdates: any = { updated_at: nowIso() };
      if (db.description !== undefined) templateUpdates.description = db.description;
      if (db.amount !== undefined) templateUpdates.amount = db.amount;
      if (db.category !== undefined) templateUpdates.category = db.category;
      if (db.account_id !== undefined) templateUpdates.account_id = db.account_id;
      if (db.card_id !== undefined) templateUpdates.card_id = db.card_id;

      let newDay: number | null = null;
      if (updates.date !== undefined) {
        newDay = parseDateParts(updates.date).day;
        templateUpdates.day_of_month = newDay;
        if (oldRow.fixed_month === monthKeyFromDate(template.start_date)) {
          templateUpdates.start_date = updates.date;
        }
      }

      const { error: templateUpdateError } = await supabase
        .from('fixed_expenses')
        .update(templateUpdates)
        .eq('id', fixedExpenseId)
        .eq('user_id', userId);

      if (templateUpdateError) throw new Error(templateUpdateError.message);

      const propagation: any = {};
      if (db.description !== undefined) propagation.description = db.description;
      if (db.amount !== undefined) propagation.amount = db.amount;
      if (db.category !== undefined) propagation.category = db.category;
      if (db.account_id !== undefined) propagation.account_id = db.account_id;
      if (db.card_id !== undefined) propagation.card_id = db.card_id;

      if (newDay !== null) {
        const { data: future, error: futureError } = await supabase
          .from('transactions')
          .select('id, fixed_month')
          .eq('fixed_expense_id', fixedExpenseId)
          .gt('fixed_month', oldRow.fixed_month)
          .eq('is_paid', false);

        if (futureError) throw new Error(futureError.message);

        for (const row of future || []) {
          const [year, month] = row.fixed_month.split('-').map(Number);
          const { error: futureUpdateError } = await supabase
            .from('transactions')
            .update({ ...propagation, date: occurrenceDate(year, month - 1, newDay) })
            .eq('id', row.id);

          if (futureUpdateError) throw new Error(futureUpdateError.message);
        }
      } else if (Object.keys(propagation).length > 0) {
        const { error: futureUpdateError } = await supabase
          .from('transactions')
          .update(propagation)
          .eq('fixed_expense_id', fixedExpenseId)
          .gt('fixed_month', oldRow.fixed_month)
          .eq('is_paid', false);

        if (futureUpdateError) throw new Error(futureUpdateError.message);
      }

      return mapTransactionRow(data);
    }

    // Ainda não era fixa e passou a ser: cria o modelo e vincula esta ocorrência.
    if (updates.isFixed === true) {
      if (
        isRepetitionTransaction({
          description: oldRow.description,
          installments: oldRow.installments,
          originalTransactionId: oldRow.original_transaction_id,
        })
      ) {
        throw new Error('Uma repetição não pode ser convertida em despesa fixa.');
      }

      const date = updates.date || oldRow.date;
      const { day } = parseDateParts(date);

      const { data: template, error: templateError } = await supabase
        .from('fixed_expenses')
        .insert({
          user_id: userId,
          description: db.description ?? oldRow.description,
          amount: db.amount ?? oldRow.amount,
          category: db.category ?? oldRow.category,
          account_id: db.account_id ?? oldRow.account_id,
          card_id: db.card_id ?? oldRow.card_id,
          day_of_month: day,
          start_date: date,
        })
        .select()
        .single();

      if (templateError || !template) {
        throw new Error(templateError?.message || 'Não foi possível criar a despesa fixa.');
      }

      db.fixed_expense_id = template.id;
      db.fixed_month = monthKeyFromDate(date);

      const { data, error } = await supabase
        .from('transactions')
        .update(db)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        await supabase.from('fixed_expenses').delete().eq('id', template.id).eq('user_id', userId);
        throw new Error(error.message);
      }

      const now = new Date();
      const currentMonth = monthKeyFromParts(now.getFullYear(), now.getMonth());
      if (db.fixed_month < currentMonth) {
        try {
          await fixedExpenseService.ensureForMonth(userId, now.getFullYear(), now.getMonth());
        } catch (ensureError) {
          console.error('Erro ao gerar a ocorrência do mês atual da despesa fixa:', ensureError);
        }
      }

      return mapTransactionRow(data);
    }

    throw new Error('Atualização de despesa fixa inválida.');
  },

  /**
   * Prepara a exclusão e retorna os IDs que devem ser removidos.
   * A exclusão em si passa pelo fluxo normal para ajustar saldo/fatura.
   */
  async prepareDelete(
    userId: string,
    transaction: Transaction,
    mode: FixedDeleteMode
  ): Promise<string[]> {
    const fixedExpenseId = transaction.fixedExpenseId;
    const month = transaction.fixedMonth;

    if (!fixedExpenseId || !month) return [transaction.id];

    if (mode === 'single') {
      return [transaction.id];
    }

    const [year, monthNumber] = month.split('-').map(Number);
    const futureIds = await getFutureUnpaidIds(fixedExpenseId, month);

    if (mode === 'future') {
      await deactivateFixedExpense(userId, fixedExpenseId, previousMonthEnd(month));
      return [transaction.id, ...futureIds];
    }

    await deactivateFixedExpense(userId, fixedExpenseId, lastDayOfMonth(year, monthNumber - 1));
    await supabase
      .from('transactions')
      .update({ fixed_expense_id: null, fixed_month: null })
      .eq('id', transaction.id);
    return futureIds;
  },
};
