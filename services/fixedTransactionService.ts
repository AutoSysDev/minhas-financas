import { supabase } from './supabase';
import { Transaction, TransactionType } from '../types';
import {
  lastDayOfMonth,
  monthKeyFromDate,
  monthKeyFromParts,
  occurrenceDate,
  previousMonthEnd,
  isRepetitionTransaction,
  buildOccurrenceRows,
  fixedTransactionLabel,
  stripTransferPrefix,
  FixedTemplate,
} from '../utils/fixedTransactions';

export type FixedDeleteMode = 'single' | 'future' | 'end';

const nowIso = () => new Date().toISOString();

const SUPPORTED_TYPES: TransactionType[] = [
  TransactionType.INCOME,
  TransactionType.EXPENSE,
  TransactionType.TRANSFER,
];

/** Rótulo da série a partir do tipo (usado nas mensagens de erro/toast). */
const labelOf = (type: TransactionType): string => fixedTransactionLabel(type).toLowerCase();

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
  isFixed: Boolean(row.fixed_transaction_id),
  fixedTransactionId: row.fixed_transaction_id || undefined,
  fixedMonth: row.fixed_month || undefined,
  fixedLeg: row.fixed_leg || undefined,
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

const deactivateFixedTransaction = async (userId: string, fixedId: string, endDate: string) => {
  const { error } = await supabase
    .from('fixed_transactions')
    .update({ is_active: false, end_date: endDate, updated_at: nowIso() })
    .eq('id', fixedId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
};

const getFutureUnpaidIds = async (fixedId: string, month: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('fixed_transaction_id', fixedId)
    .gt('fixed_month', month)
    .eq('is_paid', false);

  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => row.id);
};

/** IDs de todas as pernas de um modelo no mês (transferência tem duas). */
const getMonthLegIds = async (fixedId: string, month: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('id')
    .eq('fixed_transaction_id', fixedId)
    .eq('fixed_month', month);

  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => row.id);
};

const fetchTemplate = async (userId: string, fixedId: string): Promise<FixedTemplate> => {
  const { data, error } = await supabase
    .from('fixed_transactions')
    .select('*')
    .eq('id', fixedId)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error(error?.message || 'Série fixa não encontrada.');
  return data as FixedTemplate;
};

/** Propaga o modelo atualizado para as ocorrências futuras ainda não pagas. */
const propagateToFuture = async (
  template: FixedTemplate,
  currentMonth: string
): Promise<void> => {
  const { data: future, error } = await supabase
    .from('transactions')
    .select('id, fixed_month, fixed_leg')
    .eq('fixed_transaction_id', template.id)
    .gt('fixed_month', currentMonth)
    .eq('is_paid', false);

  if (error) throw new Error(error.message);

  for (const row of future || []) {
    const [year, month] = row.fixed_month.split('-').map(Number);
    const date = occurrenceDate(year, month - 1, template.day_of_month);

    const propagation: any =
      template.type === TransactionType.TRANSFER
        ? {
            description:
              row.fixed_leg === 'in'
                ? `Transferência recebida: ${template.description}`
                : `Transferência enviada: ${template.description}`,
            amount: template.amount,
            category: 'Transferência',
            account_id:
              row.fixed_leg === 'in'
                ? template.destination_account_id
                : template.account_id,
            card_id: null,
            date,
          }
        : {
            description: template.description,
            amount: template.amount,
            category: template.category,
            account_id: template.account_id,
            card_id: template.card_id,
            date,
          };

    const { error: updateError } = await supabase
      .from('transactions')
      .update(propagation)
      .eq('id', row.id);

    if (updateError) throw new Error(updateError.message);
  }
};

export const fixedTransactionService = {
  /** Cria a série fixa e a ocorrência do mês escolhido. */
  async createFixedTransaction(userId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction[]> {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!SUPPORTED_TYPES.includes(transaction.type)) {
      throw new Error('Tipo de transação não suportado para série fixa.');
    }
    if (transaction.installments && transaction.installments > 1) {
      throw new Error('Uma série fixa não pode ser parcelada.');
    }
    if (transaction.type === TransactionType.TRANSFER && !transaction.destinationAccountId) {
      throw new Error('Informe a conta de destino da transferência fixa.');
    }

    const { day } = parseDateParts(transaction.date);
    const fixedMonth = monthKeyFromDate(transaction.date);

    const { data: template, error: templateError } = await supabase
      .from('fixed_transactions')
      .insert({
        user_id: userId,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.type === TransactionType.TRANSFER ? 'Transferência' : transaction.category || null,
        account_id: transaction.accountId || null,
        card_id: transaction.cardId || null,
        destination_account_id: transaction.destinationAccountId || null,
        day_of_month: day,
        start_date: transaction.date,
        is_paid_default: transaction.type === TransactionType.TRANSFER,
      })
      .select()
      .single();

    if (templateError || !template) {
      throw new Error(templateError?.message || 'Não foi possível criar a série fixa.');
    }

    const rows = buildOccurrenceRows(userId, template as FixedTemplate, ...monthParts(fixedMonth))
      .map((row) => ({
        ...row,
        is_paid:
          row.type === TransactionType.TRANSFER
            ? row.is_paid
            : transaction.isPaid ?? true,
      }));

    const { data, error } = await supabase.from('transactions').insert(rows).select();

    if (error) {
      await supabase.from('fixed_transactions').delete().eq('id', template.id).eq('user_id', userId);
      throw new Error(error.message);
    }

    // Se a série começou em um mês passado, garante também a ocorrência do mês atual.
    const now = new Date();
    const currentMonth = monthKeyFromParts(now.getFullYear(), now.getMonth());
    if (fixedMonth < currentMonth) {
      try {
        await fixedTransactionService.ensureForMonth(userId, now.getFullYear(), now.getMonth());
      } catch (ensureError) {
        console.error('Erro ao gerar a ocorrência do mês atual da série fixa:', ensureError);
      }
    }

    return (data || []).map(mapTransactionRow);
  },

  /**
   * Garante que exista uma ocorrência por série ativa no mês.
   * Não recria meses excluídos individualmente (registro de exceção).
   */
  async ensureForMonth(userId: string, year: number, monthIndex: number): Promise<number> {
    if (!userId) return 0;

    const month = monthKeyFromParts(year, monthIndex);
    const monthEnd = lastDayOfMonth(year, monthIndex);

    const { data: templates, error: templatesError } = await supabase
      .from('fixed_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (templatesError) throw new Error(templatesError.message);

    const active = ((templates || []) as FixedTemplate[]).filter(
      (template) =>
        template.start_date <= monthEnd &&
        (!template.end_date || template.end_date >= month)
    );

    if (active.length === 0) return 0;

    const { data: skips, error: skipsError } = await supabase
      .from('fixed_transaction_skips')
      .select('fixed_transaction_id')
      .eq('user_id', userId)
      .eq('month', month);

    if (skipsError) throw new Error(skipsError.message);

    const skipped = new Set((skips || []).map((row: any) => row.fixed_transaction_id));

    // Ocorrências que já existem no mês não precisam ser recriadas.
    const { data: existing, error: existingError } = await supabase
      .from('transactions')
      .select('fixed_transaction_id, fixed_leg')
      .eq('user_id', userId)
      .eq('fixed_month', month)
      .not('fixed_transaction_id', 'is', null);

    if (existingError) throw new Error(existingError.message);

    const existingKeys = new Set(
      (existing || []).map((row: any) => `${row.fixed_transaction_id}:${row.fixed_leg || 'single'}`)
    );

    const rows = active
      .filter((template) => !skipped.has(template.id))
      .flatMap((template) => buildOccurrenceRows(userId, template, year, monthIndex))
      .filter((row) => !existingKeys.has(`${row.fixed_transaction_id}:${row.fixed_leg}`));

    if (rows.length === 0) return 0;

    const { data, error } = await supabase
      .from('transactions')
      .upsert(rows, {
        onConflict: 'fixed_transaction_id,fixed_month,fixed_leg',
        ignoreDuplicates: true,
      })
      .select();

    if (error) throw new Error(error.message);
    return data?.length || 0;
  },

  /** Atualiza uma ocorrência e mantém as futuras em sincronia. */
  async updateFixedTransaction(
    userId: string,
    transactionId: string,
    oldRow: any,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    const db = mapUpdatesToDb(updates);
    const fixedId = oldRow.fixed_transaction_id as string | undefined;

    if (Object.keys(db).length === 0 && updates.isFixed === undefined) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw new Error(error.message);
      return mapTransactionRow(data);
    }

    // Desmarcou "fixa": encerra a repetição e mantém este mês como transação normal.
    if (updates.isFixed === false) {
      if (fixedId) {
        const endDate = previousMonthEnd(oldRow.fixed_month || monthKeyFromDate(oldRow.date));
        await deactivateFixedTransaction(userId, fixedId, endDate);
        await supabase
          .from('transactions')
          .delete()
          .eq('fixed_transaction_id', fixedId)
          .gt('fixed_month', oldRow.fixed_month)
          .eq('is_paid', false);
      }

      db.fixed_transaction_id = null;
      db.fixed_month = null;
      db.fixed_leg = 'single';

      const { data, error } = await supabase
        .from('transactions')
        .update(db)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Transferência: a outra perna do mês também deixa a série.
      if (fixedId && oldRow.fixed_leg && oldRow.fixed_leg !== 'single') {
        const { error: siblingError } = await supabase
          .from('transactions')
          .update({ fixed_transaction_id: null, fixed_month: null, fixed_leg: 'single' })
          .eq('fixed_transaction_id', fixedId)
          .eq('fixed_month', oldRow.fixed_month)
          .neq('id', transactionId);

        if (siblingError) throw new Error(siblingError.message);
      }

      return mapTransactionRow(data);
    }

    // Já é fixa: atualiza esta ocorrência, o modelo e as futuras ainda não pagas.
    if (fixedId) {
      if (updates.type !== undefined && updates.type !== oldRow.type) {
        throw new Error(
          `Para trocar o tipo, encerre esta ${labelOf(oldRow.type)} e crie outra série.`
        );
      }

      if (updates.date !== undefined && monthKeyFromDate(updates.date) !== oldRow.fixed_month) {
        throw new Error('Para uma série fixa, altere apenas o dia dentro do mesmo mês.');
      }

      const template = await fetchTemplate(userId, fixedId);

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
      if (db.description !== undefined) {
        templateUpdates.description =
          template.type === TransactionType.TRANSFER
            ? stripTransferPrefix(db.description)
            : db.description;
      }
      if (db.amount !== undefined) templateUpdates.amount = db.amount;
      if (db.category !== undefined && template.type !== TransactionType.TRANSFER) {
        templateUpdates.category = db.category;
      }
      if (db.account_id !== undefined) {
        if (oldRow.fixed_leg === 'in') templateUpdates.destination_account_id = db.account_id;
        else templateUpdates.account_id = db.account_id;
      }
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
        .from('fixed_transactions')
        .update(templateUpdates)
        .eq('id', fixedId)
        .eq('user_id', userId);

      if (templateUpdateError) throw new Error(templateUpdateError.message);

      // Marcar como pago/despago uma perna de transferência marca o par do mês.
      if (db.is_paid !== undefined && oldRow.fixed_leg && oldRow.fixed_leg !== 'single') {
        const { error: siblingError } = await supabase
          .from('transactions')
          .update({ is_paid: db.is_paid })
          .eq('fixed_transaction_id', fixedId)
          .eq('fixed_month', oldRow.fixed_month)
          .neq('id', transactionId);

        if (siblingError) throw new Error(siblingError.message);
      }

      await propagateToFuture({ ...template, ...templateUpdates }, oldRow.fixed_month);

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
        throw new Error('Uma repetição não pode ser convertida em série fixa.');
      }

      const type = (updates.type || oldRow.type) as TransactionType;
      if (!SUPPORTED_TYPES.includes(type)) {
        throw new Error('Tipo de transação não suportado para série fixa.');
      }

      const destinationAccountId = updates.destinationAccountId || oldRow.destination_account_id;
      if (type === TransactionType.TRANSFER && !destinationAccountId) {
        throw new Error(
          'Para uma transferência fixa, informe a conta de destino ao criar a transferência.'
        );
      }

      const date = updates.date || oldRow.date;
      const { day } = parseDateParts(date);

      const { data: template, error: templateError } = await supabase
        .from('fixed_transactions')
        .insert({
          user_id: userId,
          description: db.description ?? oldRow.description,
          amount: db.amount ?? oldRow.amount,
          type,
          category: db.category ?? oldRow.category,
          account_id: db.account_id ?? oldRow.account_id,
          card_id: db.card_id ?? oldRow.card_id,
          destination_account_id: destinationAccountId || null,
          day_of_month: day,
          start_date: date,
          is_paid_default: type === TransactionType.TRANSFER,
        })
        .select()
        .single();

      if (templateError || !template) {
        throw new Error(templateError?.message || 'Não foi possível criar a série fixa.');
      }

      db.fixed_transaction_id = template.id;
      db.fixed_month = monthKeyFromDate(date);
      db.fixed_leg = oldRow.fixed_leg || 'single';

      const { data, error } = await supabase
        .from('transactions')
        .update(db)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        await supabase.from('fixed_transactions').delete().eq('id', template.id).eq('user_id', userId);
        throw new Error(error.message);
      }

      const now = new Date();
      const currentMonth = monthKeyFromParts(now.getFullYear(), now.getMonth());
      if (db.fixed_month < currentMonth) {
        try {
          await fixedTransactionService.ensureForMonth(userId, now.getFullYear(), now.getMonth());
        } catch (ensureError) {
          console.error('Erro ao gerar a ocorrência do mês atual da série fixa:', ensureError);
        }
      }

      return mapTransactionRow(data);
    }

    throw new Error('Atualização de série fixa inválida.');
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
    const fixedId = transaction.fixedTransactionId;
    const month = transaction.fixedMonth;

    if (!fixedId || !month) return [transaction.id];

    if (mode === 'single') {
      // Transferência: excluir "só este mês" remove as duas pernas do mês.
      if (transaction.fixedLeg && transaction.fixedLeg !== 'single') {
        return getMonthLegIds(fixedId, month);
      }
      return [transaction.id];
    }

    const [year, monthNumber] = month.split('-').map(Number);
    const futureIds = await getFutureUnpaidIds(fixedId, month);
    const monthIds = await getMonthLegIds(fixedId, month);

    if (mode === 'future') {
      await deactivateFixedTransaction(userId, fixedId, previousMonthEnd(month));
      return [...monthIds, ...futureIds];
    }

    await deactivateFixedTransaction(userId, fixedId, lastDayOfMonth(year, monthNumber - 1));
    await supabase
      .from('transactions')
      .update({ fixed_transaction_id: null, fixed_month: null, fixed_leg: 'single' })
      .in('id', monthIds);

    return futureIds;
  },
};

const monthParts = (month: string): [number, number] => {
  const [year, monthNumber] = month.split('-').map(Number);
  return [year, monthNumber - 1];
};
