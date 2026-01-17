import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { Dropdown } from '../components/Dropdown';
import { Modal } from '../components/Modal';
import { NewTransactionModal } from '../components/NewTransactionModal';
import { BankImportModal } from '../components/BankImportModal';
import { TransactionRow, TransactionCard } from '../components/TransactionItem';
import { useFinance } from '../context/FinanceContext';
import { useTransactions, useInfiniteTransactions, useTransactionSummary, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useTransactions';
import { Transaction, TransactionType } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { TransactionListSkeleton } from '../components/TransactionListSkeleton';
import { FiscalManager } from '../components/FiscalManager';
import { useTheme } from '../context/ThemeContext';
import { MonthYearPicker } from '../components/MonthYearPicker';

const Transactions: React.FC = () => {
  const { cards, accounts, transactions: allTransactions, deleteTransactions } = useFinance();
  const { theme } = useTheme();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);

  // Recurring Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [recurringGroup, setRecurringGroup] = useState<Transaction[]>([]);

  // Helper to extract recurrence info
  const extractRecurrenceData = (description: string) => {
    const match = description.match(/^(.*?) \((\d+)\/(\d+)\)$/);
    if (match) {
      return {
        baseDescription: match[1],
        current: parseInt(match[2]),
        total: parseInt(match[3])
      };
    }
    return null;
  };

  const executeRecurringDelete = async (mode: 'single' | 'future') => {
    if (!transactionToDelete) return;

    if (mode === 'single') {
      deleteTransactionMutation.mutate(transactionToDelete.id, {
        onSuccess: () => {
          toast.success("Transação excluída!");
          setDeleteModalOpen(false);
          setTransactionToDelete(null);
          setViewingTransaction(null);
        },
        onError: (error) => {
          toast.error("Erro ao excluir: " + error.message);
        }
      });
    } else {
      // Delete future
      const ids = recurringGroup.map(t => t.id);
      try {
        await deleteTransactions(ids);
        toast.success(`${ids.length} transações excluídas!`);
        setDeleteModalOpen(false);
        setTransactionToDelete(null);
        setViewingTransaction(null);
      } catch (e: any) {
        toast.error("Erro ao excluir transações: " + e.message);
      }
    }
  };

  // OCR State
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrData, setOcrData] = useState<Partial<Transaction & { transactionId?: string; receiver?: string }> | null>(null);

  // Filtros de Estado
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // 1. Calcular Datas do Período
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

  const effectiveStartDate = dateRange.start || startOfMonth;
  const effectiveEndDate = dateRange.end || endOfMonth;

  // 2. Filtros para Query (Servidor)
  const queryFilters = {
    startDate: effectiveStartDate,
    endDate: effectiveEndDate,
    type: filterType === 'all' ? undefined : filterType,
    category: selectedCategory,
    searchTerm: searchTerm,
    sortBy: sortBy
  };

  // 3. Hooks de Dados
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingTransactions
  } = useInfiniteTransactions(queryFilters);

  const { data: summaryData } = useTransactionSummary({
    startDate: effectiveStartDate,
    endDate: effectiveEndDate
  });

  const transactions = infiniteData?.pages.flat() || [];
  const totalIncome = summaryData?.totalIncome || 0;
  const totalExpense = summaryData?.totalExpense || 0;
  const balance = totalIncome - totalExpense;

  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  // Scroll Infinito Observer
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [observerTarget, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsNewModalOpen(true);
    } else {
      setIsNewModalOpen(false);
      // Limpar dados de OCR ao fechar
      if (!isNewModalOpen) setOcrData(null);
    }
  }, [searchParams]);

  // Listen for edit event from details modal
  useEffect(() => {
    const handleEditEvent = (e: CustomEvent) => {
      const transactionId = e.detail;
      const transactionToEdit = transactions.find(t => t.id === transactionId);
      if (transactionToEdit) {
        setOcrData({
          ...transactionToEdit,
          transactionId: transactionToEdit.id
        });
        setIsNewModalOpen(true);
      }
    };

    window.addEventListener('editTransaction', handleEditEvent as EventListener);
    return () => {
      window.removeEventListener('editTransaction', handleEditEvent as EventListener);
    };
  }, [transactions]);

  const handleOpenNewModal = () => {
    setOcrData(null); // Garante que abre limpo se clicado manualmente
    navigate('/transactions?action=new');
  };

  const handleCloseNewModal = () => {
    setIsNewModalOpen(false);
    navigate('/transactions');
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setViewingTransaction(transaction);
  };

  const handleDelete = (e: React.MouseEvent | React.TouchEvent | null, id: string) => {
    if (e) e.stopPropagation();
    const transaction = transactions.find(t => t.id === id);

    // If we can't find it in the current list (e.g. filtered), try allTransactions
    const targetTransaction = transaction || allTransactions.find(t => t.id === id);

    if (!targetTransaction) return;

    const recurrence = extractRecurrenceData(targetTransaction.description);

    if (recurrence) {
      // Is Recurring
      setTransactionToDelete(targetTransaction);

      // Find future transactions
      // We look for transactions with same base description, same total count, same type, and sequence >= current
      const future = allTransactions.filter(t => {
        const r = extractRecurrenceData(t.description);
        return r &&
          r.baseDescription === recurrence.baseDescription &&
          r.total === recurrence.total &&
          r.current >= recurrence.current &&
          t.type === targetTransaction.type
      });

      setRecurringGroup(future);
      setDeleteModalOpen(true);
    } else {
      if (window.confirm("Deseja realmente excluir esta transação?")) {
        deleteTransactionMutation.mutate(id, {
          onSuccess: () => {
            toast.success("Transação excluída com sucesso!");
            setViewingTransaction(null);
          },
          onError: (error) => {
            toast.error("Erro ao excluir transação: " + error.message);
          }
        });
      }
    }
  };

  const handleEdit = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    const transactionToEdit = transactions.find(t => t.id === id);
    if (transactionToEdit) {
      setOcrData({
        ...transactionToEdit,
        transactionId: transactionToEdit.id // Pass ID to identify it's an edit
      });
      setIsNewModalOpen(true);
    }
  };

  const handleDuplicate = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    const transactionToDuplicate = transactions.find(t => t.id === id);
    if (transactionToDuplicate) {
      // Remove ID to treat as new
      const { id, ...rest } = transactionToDuplicate;
      setOcrData({
        ...rest,
        description: `${rest.description} (Cópia)`,
        date: new Date().toISOString().split('T')[0] // Default to today
      });
      setIsNewModalOpen(true);
    }
  };

  const handleSaveNew = async (t: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => {
    try {
      if (Array.isArray(t)) {
        // Bulk Create (Recorrência) - Not supported by single mutation directly efficiently without Promise.all
        // But useCreateTransaction expects single object.
        // We can loop here.
        const promises = t.map(transaction => createTransactionMutation.mutateAsync(transaction));
        await Promise.all(promises);
        toast.success(`${t.length} transações criadas!`);
      } else if (ocrData && ocrData.transactionId && transactions.find(tr => tr.id === ocrData.transactionId)) {
        // Edit Mode
        await updateTransactionMutation.mutateAsync({ id: ocrData.transactionId, updates: t });
        toast.success("Transação atualizada!");
      } else {
        // Create Mode
        await createTransactionMutation.mutateAsync(t);
        toast.success("Transação criada!");
      }
      handleCloseNewModal();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  // --- Lógica OCR (Scan & Pay) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processReceiptImage(file);
    }
  };

  const processReceiptImage = async (file: File) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('apikey', 'K82571370988957'); // Chave fornecida
      formData.append('file', file);
      formData.append('language', 'por');
      formData.append('isOverlayRequired', 'true'); // Overlay ajuda a manter a ordem das linhas
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data && data.ParsedResults && data.ParsedResults.length > 0) {
        const textResult = data.ParsedResults[0];
        const fullText = textResult.ParsedText;
        const lines = textResult.TextOverlay ? textResult.TextOverlay.Lines.map((l: any) => l.LineText) : fullText.split('\n');

        console.log('Texto extraído (Linhas):', lines);

        // --- Lógica de Extração Inteligente ---

        // 1. Valor (Procura o maior valor numérico)
        const priceRegex = /R?\$?\s?(\d{1,3}(?:\.\d{3})*,\d{2})/g;
        let maxPrice = 0;
        const allPrices = fullText.match(priceRegex);
        if (allPrices) {
          const values = allPrices.map((p: string) => parseFloat(p.replace(/R?\$?\s?/g, '').replace(/\./g, '').replace(',', '.')));
          maxPrice = Math.max(...values);
        }

        // 2. Data (Procura formatos dd/mm/aaaa ou AAAA-MM-DD)
        const dateRegex = /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})/;
        let foundDate = new Date().toISOString().split('T')[0];
        const dateMatch = fullText.match(dateRegex);
        if (dateMatch) {
          const day = dateMatch[1];
          const month = dateMatch[2];
          const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
          foundDate = `${year}-${month}-${day}`;
        }

        // 3. Identificação de Contexto (Pix Inter, Nubank, etc)
        let receiverName = '';
        let transactionId = '';
        let detectedCategory = 'Outros';

        const lowerLines = lines.map((l: string) => l.toLowerCase().trim());
        const technicalLabels = ['cpf', 'cnpj', 'chave', 'instituição', 'banco', 'agência', 'conta', 'tipo', 'pagador', 'data', 'horário', 'id', 'autenticação'];
        const isTechnical = (str: string) => technicalLabels.some(label => str.toLowerCase().includes(label));

        // Busca por Beneficiário (Quem recebeu)
        const receiverIndex = lowerLines.findIndex((l: string) =>
          l.includes('quem recebeu') ||
          l.includes('destino') ||
          l.includes('beneficiário') ||
          l.includes('favorecido') ||
          l.includes('para')
        );

        if (receiverIndex !== -1) {
          // Procura nas próximas 6 linhas por um nome válido
          for (let i = receiverIndex; i < Math.min(receiverIndex + 6, lines.length); i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase().trim();

            // Ignora a própria linha do label se não tiver conteúdo
            if (i === receiverIndex) continue;

            // Se for uma linha puramente técnica, pula
            if (isTechnical(line)) continue;

            if (lowerLine.startsWith('nome')) {
              let nameCandidate = line.replace(/^nome[:\s]*/i, '').trim();
              if (nameCandidate.length < 2) {
                // Se "Nome" está vazio, checa a próxima linha
                if (i + 1 < lines.length) {
                  const nextLine = lines[i + 1].trim();
                  if (!isTechnical(nextLine)) {
                    receiverName = nextLine;
                    break;
                  }
                }
              } else {
                if (!isTechnical(nameCandidate)) {
                  receiverName = nameCandidate;
                  break;
                }
              }
            }
            // Caso onde o nome aparece logo abaixo do cabeçalho sem label "Nome"
            else if (i === receiverIndex + 1 && line.length > 3) {
              if (!line.match(/\d/)) { // Evita pegar números/CNPJ
                receiverName = line.trim();
              }
            }
          }
        }

        // Fallback: Se não achou "Quem recebeu", tenta pegar a primeira linha válida que não seja cabeçalho
        if (!receiverName || receiverName.toLowerCase() === 'nome') {
          receiverName = '';
          const ignoredWords = ['comprovante', 'pix', 'enviado', 'pagamento', 'transação', 'banco', 'inter', 'nubank', 'bradesco', 'itaú', 'santander', 'caixa', 'via', 'mobile', 'internet', 'banking', 'valor', 'data', 'horário', 'agendamento', 'autenticação', 'chave', 'cpf', 'cnpj', 'nome', 'quem', 'recebeu', 'pagou'];

          for (const line of lines) {
            const lowerLine = line.toLowerCase();
            const hasIgnored = ignoredWords.some(term => lowerLine.includes(term));
            const hasNumbers = /\d/.test(line);
            if (!hasIgnored && !hasNumbers && line.length > 4 && line.includes(' ')) {
              receiverName = line;
              break;
            }
          }
        }

        // Busca por ID da Transação
        const pixIdRegex = /(E[a-zA-Z0-9]{30,})/;
        const globalIdMatch = fullText.match(pixIdRegex);

        if (globalIdMatch) {
          transactionId = globalIdMatch[0];
        } else {
          // Tenta achar ID genérico
          const idIndex = lowerLines.findIndex((l: string) => l.includes('id da transação') || l.includes('autenticação') || l.includes('e2e'));
          if (idIndex !== -1) {
            const line = lines[idIndex];
            const nextLine = idIndex + 1 < lines.length ? lines[idIndex + 1] : '';

            const genericIdRegex = /([a-zA-Z0-9]{15,})/;
            const matchSelf = line.match(genericIdRegex);
            const matchNext = nextLine.match(genericIdRegex);

            if (matchSelf && !line.toLowerCase().includes('id da transação')) transactionId = matchSelf[0];
            else if (matchNext) transactionId = matchNext[0];
          }
        }

        // Categoria sugerida
        if (fullText.toLowerCase().includes('pix')) detectedCategory = 'Transferência';
        if (fullText.toLowerCase().includes('restaurante') || fullText.toLowerCase().includes('ifood') || fullText.toLowerCase().includes('food') || fullText.toLowerCase().includes('lanche')) detectedCategory = 'Alimentação';
        if (fullText.toLowerCase().includes('uber') || fullText.toLowerCase().includes('posto') || fullText.toLowerCase().includes('99')) detectedCategory = 'Transporte';

        setOcrData({
          amount: maxPrice,
          description: receiverName || 'Pix Enviado',
          receiver: receiverName,
          transactionId: transactionId,
          date: foundDate,
          category: detectedCategory
        });

        navigate('/transactions?action=new');

      } else {
        toast.error('Não foi possível ler o texto da imagem. Tente uma foto mais clara.');
      }

    } catch (error) {
      console.error("Erro no OCR:", error);
      toast.error("Erro ao processar imagem. Verifique sua conexão.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Lógica de Data e Filtros ---
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getTransactionDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const parts = dateStr.split(' ');
    if (parts.length === 2) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const months: { [key: string]: number } = { 'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5, 'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11 };
      const month = months[monthStr] !== undefined ? months[monthStr] : 0;
      const year = new Date().getFullYear();
      return new Date(year, month, day);
    }
    return new Date();
  };

  // Versão legada de filtragem local removida em favor da filtragem no servidor
  const filteredTransactions = transactions;

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-fade-in relative pb-20 md:pb-0">

      {/* Input Oculto para Câmera */}
      <input
        type="file"
        id="receipt-upload"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in">
          <div className="size-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold">Lendo Comprovante...</h3>
          <p className="text-sm text-gray-300 mt-2">A inteligência artificial está extraindo os dados.</p>
        </div>
      )}

      {/* Cabeçalho e Navegação */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className={`text-2xl md:text-4xl font-black leading-tight tracking-[-0.033em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Transações</h1>

          <div className="flex items-center gap-2">
            {/* Botão Scanner */}
            <label
              htmlFor="receipt-upload"
              className={`flex size-10 md:size-11 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-all ${theme === 'light'
                ? 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50 hover:text-teal-600'
                : 'bg-white/[0.05] border-white/[0.1] text-gray-400 hover:bg-white/[0.1] hover:text-teal-400'
                }`}
              title="Escanear Comprovante"
            >
              <Icon name="document_scanner" className="text-xl md:text-2xl" />
            </label>

            {/* Botão Importar */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className={`flex size-10 md:size-11 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-all ${theme === 'light'
                ? 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50 hover:text-teal-600'
                : 'bg-white/[0.05] border-white/[0.1] text-gray-400 hover:bg-white/[0.1] hover:text-teal-400'
                }`}
              title="Importar Extrato (PDF, OFX, XLSX)"
            >
              <Icon name="upload_file" className="text-xl md:text-2xl" />
            </button>

            <button
              onClick={handleOpenNewModal}
              className="flex min-w-[48px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 md:h-11 px-4 bg-teal-500 text-white text-base font-medium leading-normal gap-2 hover:bg-teal-600 transition-colors shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
            >
              <Icon name="add" />
              <span className="truncate hidden md:inline">Nova Transação</span>
              <span className="md:hidden">Nova</span>
            </button>
          </div>
        </div>

        {/* Navegador de Mês */}
        <div className={`flex items-center justify-between backdrop-blur-md border p-1 rounded-xl shadow-sm w-full md:max-w-md mx-auto transition-all ${theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-white/[0.02] border-white/[0.05]'
          }`}>
          <button onClick={() => navigateMonth(-1)} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
            <Icon name="chevron_left" />
          </button>
          <button
            onClick={() => setIsMonthPickerOpen(true)}
            className={`flex flex-col items-center px-4 py-1 rounded-lg transition-colors cursor-pointer ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}
          >
            <span className={`text-sm font-bold capitalize leading-none transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
            </span>
            <span className={`text-[10px] font-medium leading-none mt-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>
              {currentDate.getFullYear()}
            </span>
          </button>
          <button onClick={() => navigateMonth(1)} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
            <Icon name="chevron_right" />
          </button>
        </div>

        {/* Resumo do Mês e Filtros Rápidos */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <div
            onClick={() => setFilterType(filterType === 'income' ? 'all' : 'income')}
            className={`p-3 md:p-4 rounded-xl border text-center cursor-pointer transition-all active:scale-95 backdrop-blur-md ${filterType === 'income'
              ? (theme === 'light' ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]')
              : (theme === 'light' ? 'bg-white border-gray-100 hover:bg-gray-50' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]')
              }`}
          >
            <p className={`text-xs font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>Receitas</p>
            <p className={`text-sm md:text-lg font-black transition-colors ${theme === 'light' ? 'text-green-700' : 'text-green-300'}`}><PrivateValue>{formatCurrency(totalIncome)}</PrivateValue></p>
          </div>
          <div
            onClick={() => setFilterType(filterType === 'expense' ? 'all' : 'expense')}
            className={`p-3 md:p-4 rounded-xl border text-center cursor-pointer transition-all active:scale-95 backdrop-blur-md ${filterType === 'expense'
              ? (theme === 'light' ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]')
              : (theme === 'light' ? 'bg-white border-gray-100 hover:bg-gray-50' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]')
              }`}
          >
            <p className={`text-xs font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>Despesas</p>
            <p className={`text-sm md:text-lg font-black transition-colors ${theme === 'light' ? 'text-red-700' : 'text-red-300'}`}><PrivateValue>{formatCurrency(totalExpense)}</PrivateValue></p>
          </div>
          <div
            onClick={() => setFilterType('all')}
            className={`p-3 md:p-4 rounded-xl border text-center cursor-pointer transition-all active:scale-95 backdrop-blur-md ${filterType === 'all'
              ? (theme === 'light' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)]')
              : (theme === 'light' ? 'bg-white border-gray-100 hover:bg-gray-50' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]')
              }`}
          >
            <p className={`text-xs font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Balanço</p>
            <p className={`text-sm md:text-lg font-black transition-colors ${balance >= 0
              ? (theme === 'light' ? 'text-blue-700' : 'text-blue-300')
              : (theme === 'light' ? 'text-red-700' : 'text-red-300')
              }`}><PrivateValue>{formatCurrency(balance)}</PrivateValue></p>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Ordenação */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Icon name="search" className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border transition-all outline-none text-sm ${theme === 'light'
                ? 'bg-white border-gray-200 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                : 'bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500/50 focus:border-transparent'
                }`}
            />
          </div>
          <div className="w-full sm:w-auto">
            <Dropdown
              options={[
                { label: 'Mais recentes', value: 'date-desc' },
                { label: 'Mais antigas', value: 'date-asc' },
                { label: 'Maior valor', value: 'amount-desc' },
                { label: 'Menor valor', value: 'amount-asc' }
              ]}
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              className="w-full sm:w-48"
            />
          </div>
        </div>

        {/* Filtros Avançados */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-auto min-w-[150px]">
            <Dropdown
              options={[
                { label: 'Todas Categorias', value: 'Todas' },
                ...Array.from(new Set(transactions.map(t => t.category))).map(c => ({ label: c, value: c }))
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              className="w-full"
            />
          </div>
          <div className={`flex flex-1 sm:flex-none items-center gap-2 border rounded-xl px-3 py-2 min-w-[140px] transition-all focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 ${theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-white/[0.05] border-white/[0.1]'
            }`}>
            <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>De:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className={`bg-transparent text-xs outline-none cursor-pointer w-full font-medium transition-colors ${theme === 'light'
                ? 'text-slate-900'
                : 'text-white [&::-webkit-calendar-picker-indicator]:invert'
                }`}
            />
          </div>
          <div className={`flex flex-1 sm:flex-none items-center gap-2 border rounded-xl px-3 py-2 min-w-[140px] transition-all focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 ${theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-white/[0.05] border-white/[0.1]'
            }`}>
            <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>Até:</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className={`bg-transparent text-xs outline-none cursor-pointer w-full font-medium transition-colors ${theme === 'light'
                ? 'text-slate-900'
                : 'text-white [&::-webkit-calendar-picker-indicator]:invert'
                }`}
            />
          </div>
          {(dateRange.start || dateRange.end || selectedCategory !== 'Todas') && (
            <button
              onClick={() => { setDateRange({ start: '', end: '' }); setSelectedCategory('Todas'); }}
              className={`text-xs underline transition-colors ${theme === 'light' ? 'text-teal-600 hover:text-teal-700' : 'text-teal-400 hover:text-teal-300'}`}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Transações */}
      <div className={`backdrop-blur-md rounded-xl shadow-sm border overflow-hidden min-h-[300px] transition-all ${theme === 'light'
        ? 'bg-white border-gray-100 shadow-slate-200/50'
        : 'bg-white/[0.02] border-white/[0.05]'
        }`}>
        {isLoadingTransactions ? (
          <div className="p-4">
            <TransactionListSkeleton />
          </div>
        ) : (
          <>
            {/* Versão Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`font-medium border-b transition-colors ${theme === 'light'
                  ? 'bg-gray-50 text-slate-500 border-gray-100'
                  : 'bg-white/[0.05] text-gray-400 border-white/[0.05]'
                  }`}>
                  <tr>
                    <th className="px-6 py-3">Descrição</th>
                    <th className="px-6 py-3">Categoria</th>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3 text-right">Valor</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors ${theme === 'light' ? 'divide-gray-50' : 'divide-white/[0.05]'}`}>
                  {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      onClick={() => handleTransactionClick(t)}
                    />
                  )) : (
                    <tr>
                      <td colSpan={5} className={`px-6 py-12 text-center transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Icon name="event_busy" className="text-3xl opacity-50" />
                          <p>Nenhuma transação encontrada.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* Elemento para scroll infinito */}
                  <tr ref={observerTarget} className="h-4">
                    <td colSpan={5}>
                      {isFetchingNextPage && (
                        <div className="flex justify-center p-4">
                          <div className="size-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Versão Mobile */}
            <div className={`md:hidden flex flex-col divide-y transition-colors ${theme === 'light' ? 'divide-gray-50' : 'divide-white/[0.05]'}`}>
              {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  onClick={() => handleTransactionClick(t)}
                  onEdit={(e) => handleEdit(e, t.id)}
                  onDuplicate={(e) => handleDuplicate(e, t.id)}
                  onDelete={(e) => handleDelete(e, t.id)}
                />
              )) : (
                <div className={`p-12 text-center transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>
                  <Icon name="event_busy" className="text-3xl opacity-50 mb-2" />
                  <p>Nenhuma transação encontrada.</p>
                </div>
              )}
              {/* Elemento para scroll infinito */}
              <div ref={observerTarget} className="h-4">
                {isFetchingNextPage && (
                  <div className="flex justify-center p-4">
                    <div className="size-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {isNewModalOpen && (
        <NewTransactionModal
          onClose={handleCloseNewModal}
          onSave={handleSaveNew}
          cards={cards}
          accounts={accounts}
          initialData={ocrData}
        />
      )}

      {viewingTransaction && (
        <DetailsTransactionModal
          transaction={viewingTransaction}
          onClose={() => setViewingTransaction(null)}
          onDelete={(id) => handleDelete(null, id)}
          onDuplicate={(id) => { handleDuplicate({ stopPropagation: () => { } } as any, id); setViewingTransaction(null); }}
        />
      )}

      {isImportModalOpen && (
        <BankImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          accounts={accounts}
        />
      )}

      {isMonthPickerOpen && (
        <MonthYearPicker
          currentDate={currentDate}
          onSelect={setCurrentDate}
          onClose={() => setIsMonthPickerOpen(false)}
        />
      )}

      {deleteModalOpen && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Excluir Transação Recorrente"
        >
          <div className="space-y-4">
            <p className={`text-sm ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
              Esta é uma transação recorrente. Como deseja prosseguir com a exclusão?
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => executeRecurringDelete('single')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${theme === 'light'
                  ? 'bg-white border-gray-200 hover:bg-gray-50 text-slate-900'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  }`}
              >
                <div className="size-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
                  <Icon name="event" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Apagar apenas esta</p>
                  <p className="text-xs opacity-60">Exclui somente a transação selecionada.</p>
                </div>
              </button>

              <button
                onClick={() => executeRecurringDelete('future')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${theme === 'light'
                  ? 'bg-red-50 border-red-100 hover:bg-red-100 text-red-700'
                  : 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400'
                  }`}
              >
                <div className="size-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                  <Icon name="event_repeat" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Apagar esta e as próximas</p>
                  <p className="text-xs opacity-60">Exclui esta e todas as {recurringGroup.length} transações futuras da série.</p>
                </div>
              </button>
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${theme === 'light' ? 'text-slate-500 hover:text-slate-700' : 'text-gray-400 hover:text-white'
                  }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// --- Subcomponents ---





const DetailsTransactionModal: React.FC<{
  transaction: Transaction;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
}> = ({ transaction, onClose, onDelete, onDuplicate }) => {
  const { theme } = useTheme();
  const isExpense = transaction.type === TransactionType.EXPENSE;
  const colorClass = isExpense ? 'text-red-400' : 'text-green-400';
  const bgClass = isExpense ? 'bg-red-500/20' : 'bg-green-500/20';

  const handleDelete = () => {
    onDelete(transaction.id);
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(transaction.id);
    }
  };

  const handleEdit = () => {
    // Close this modal and open edit modal
    onClose();
    // Trigger edit via the parent component
    const editEvent = new CustomEvent('editTransaction', { detail: transaction.id });
    window.dispatchEvent(editEvent);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      hideHeader={true}
      maxWidth="max-w-sm"
      noPadding={true}
    >
      {/* Custom Header inside Standard Modal */}
      <div className={`p-6 border-b relative transition-colors ${isExpense
        ? (theme === 'light' ? 'bg-red-50 border-red-100' : 'bg-red-500/10 border-white/[0.08]')
        : (theme === 'light' ? 'bg-green-50 border-green-100' : 'bg-green-500/10 border-white/[0.08]')
        }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${theme === 'light'
            ? 'text-slate-400 hover:text-slate-600 hover:bg-gray-200'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
        >
          <Icon name="close" className="text-xl" />
        </button>
        <div className="flex flex-col items-center gap-4">
          <div className={`size-16 rounded-full flex items-center justify-center shadow-lg ring-1 transition-all ${isExpense
            ? (theme === 'light' ? 'bg-white text-red-500 ring-red-100' : 'bg-red-500/20 text-red-400 ring-white/10')
            : (theme === 'light' ? 'bg-white text-green-500 ring-green-100' : 'bg-green-500/20 text-green-400 ring-white/10')
            }`}>
            <Icon name={isExpense ? 'shopping_cart' : 'trending_up'} className="text-3xl" />
          </div>
          <div className="flex gap-3 w-full">
            <div className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${theme === 'light'
              ? 'bg-white border-gray-100 shadow-sm'
              : 'bg-white/[0.05] border-white/[0.1]'
              }`}>
              <span className={`text-[10px] mb-1 uppercase font-bold tracking-wider transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>Valor Total</span>
              <span className={`text-2xl font-black transition-colors ${isExpense ? (theme === 'light' ? 'text-red-600' : 'text-red-400') : (theme === 'light' ? 'text-teal-600' : 'text-teal-400')}`}>
                <PrivateValue>{isExpense ? '-' : '+'} {formatCurrency(transaction.amount)}</PrivateValue>
              </span>
            </div>
            <div className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${theme === 'light'
              ? 'bg-white border-gray-100 shadow-sm'
              : 'bg-white/[0.05] border-white/[0.1]'
              }`}>
              <span className={`text-[10px] mb-1 uppercase font-bold tracking-wider transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>Status</span>
              <span className={`text-sm font-bold flex items-center gap-1 transition-colors ${transaction.isPaid
                ? (theme === 'light' ? 'text-green-600' : 'text-green-400')
                : (theme === 'light' ? 'text-yellow-600' : 'text-yellow-400')
                }`}>
                <Icon name={transaction.isPaid ? "check_circle" : "schedule"} className="text-base" />
                {transaction.isPaid ? 'Efetivada' : 'Pendente'}
              </span>
            </div>
          </div>
          {transaction.installmentNumber && transaction.installments && (
            <span className={`px-3 py-1 rounded-full text-[10px] font-medium border transition-colors ${theme === 'light'
              ? 'bg-gray-100 text-slate-600 border-gray-200'
              : 'bg-white/5 text-gray-300 border-white/10'
              }`}>
              Parcela {transaction.installmentNumber}/{transaction.installments}
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className={`p-5 space-y-5 transition-colors ${theme === 'light' ? 'bg-white' : ''}`}>
        <DetailRow icon="category" label="Categoria" value={transaction.category} />
        <DetailRow icon="calendar_today" label="Data" value={formatDate(transaction.date)} />
        <DetailRow
          icon={transaction.accountId ? "account_balance" : "credit_card"}
          label="Origem"
          value={transaction.accountId ? "Conta Corrente" : "Cartão de Crédito"}
        />
        {transaction.id && (
          <DetailRow icon="fingerprint" label="ID da Transação" value={transaction.id.substring(0, 8)} />
        )}

        <FiscalManager transaction={transaction} />
      </div>

      {/* Action Buttons */}
      <div className={`p-4 border-t grid grid-cols-3 gap-3 transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.02] border-white/[0.08]'}`}>
        <button
          onClick={handleEdit}
          className={`flex flex-col items-center justify-center gap-1 h-14 rounded-xl font-semibold border transition-all active:scale-95 group ${theme === 'light'
            ? 'bg-white text-teal-600 border-gray-200 hover:border-teal-200 hover:bg-teal-50'
            : 'bg-teal-500/5 text-teal-400 border-teal-500/10 hover:bg-teal-500/10'
            }`}
        >
          <Icon name="edit" className="text-xl group-hover:scale-110 transition-transform" />
          <span className="text-[10px]">Editar</span>
        </button>
        <button
          onClick={handleDuplicate}
          className={`flex flex-col items-center justify-center gap-1 h-14 rounded-xl font-semibold border transition-all active:scale-95 group ${theme === 'light'
            ? 'bg-white text-blue-600 border-gray-200 hover:border-blue-200 hover:bg-blue-50'
            : 'bg-blue-500/5 text-blue-400 border-blue-500/10 hover:bg-blue-500/10'
            }`}
        >
          <Icon name="content_copy" className="text-xl group-hover:scale-110 transition-transform" />
          <span className="text-[10px]">Duplicar</span>
        </button>
        <button
          onClick={handleDelete}
          className={`flex flex-col items-center justify-center gap-1 h-14 rounded-xl font-semibold border transition-all active:scale-95 group ${theme === 'light'
            ? 'bg-white text-red-600 border-gray-200 hover:border-red-200 hover:bg-red-50'
            : 'bg-red-500/5 text-red-400 border-red-500/10 hover:bg-red-500/10'
            }`}
        >
          <Icon name="delete" className="text-xl group-hover:scale-110 transition-transform" />
          <span className="text-[10px]">Excluir</span>
        </button>
      </div>
    </Modal >
  );
};

const DetailRow = ({ icon, label, value }: { icon: string, label: string, value: string }) => {
  const { theme } = useTheme();
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}><Icon name={icon} /></div>
      <div>
        <p className={`text-[10px] uppercase font-bold tracking-wide transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>{label}</p>
        <p className={`text-base font-medium transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
};



export default Transactions;
