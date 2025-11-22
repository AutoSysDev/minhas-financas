import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { Dropdown } from '../components/Dropdown';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/helpers';

const Transactions: React.FC = () => {
  const { transactions, deleteTransaction, addTransaction, updateTransaction, cards, accounts } = useFinance();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);

  // OCR State
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrData, setOcrData] = useState<Partial<Transaction & { transactionId?: string; receiver?: string }> | null>(null);

  // Filtros
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // Novos Filtros
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

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

  const handleDelete = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Deseja realmente excluir esta transação?")) {
      deleteTransaction(id);
      setViewingTransaction(null);
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
    if (Array.isArray(t)) {
      // Bulk Create (Recorrência)
      for (const transaction of t) {
        await addTransaction(transaction);
      }
    } else if (ocrData && ocrData.transactionId && transactions.find(tr => tr.id === ocrData.transactionId)) {
      // Edit Mode
      updateTransaction(ocrData.transactionId, t);
    } else {
      // Create Mode
      addTransaction(t);
    }
    handleCloseNewModal();
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
        alert('Não foi possível ler o texto da imagem. Tente uma foto mais clara.');
      }

    } catch (error) {
      console.error("Erro no OCR:", error);
      alert("Erro ao processar imagem. Verifique sua conexão.");
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

  // --- Totais do Mês (Independentes do Filtro de Tipo) ---
  const monthlyTransactions = transactions.filter(t => {
    const tDate = getTransactionDate(t.date);
    return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
  });

  const totalIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // --- Lista Filtrada (Aplica busca e filtro de tipo) ---
  const filteredTransactions = monthlyTransactions.filter(t => {
    const matchesSearch =
      searchTerm === '' ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' ||
      (filterType === 'income' && t.type === TransactionType.INCOME) ||
      (filterType === 'expense' && t.type === TransactionType.EXPENSE);

    const matchesCategory = selectedCategory === 'Todas' || t.category === selectedCategory;

    const matchesDateRange =
      (!dateRange.start || t.date >= dateRange.start) &&
      (!dateRange.end || t.date <= dateRange.end);

    return matchesSearch && matchesType && matchesCategory && matchesDateRange;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

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
          <h1 className="text-white text-2xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Transações</h1>

          <div className="flex items-center gap-2">
            {/* Botão Scanner */}
            <label
              htmlFor="receipt-upload"
              className="flex size-10 md:size-11 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white/[0.05] border border-white/[0.1] text-gray-400 hover:bg-white/[0.1] hover:text-teal-400 transition-colors"
              title="Escanear Comprovante"
            >
              <Icon name="document_scanner" className="text-xl md:text-2xl" />
            </label>

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
        <div className="flex items-center justify-between bg-white/[0.02] backdrop-blur-md border border-white/[0.05] p-1 rounded-xl shadow-sm w-full md:max-w-md mx-auto">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <Icon name="chevron_left" />
          </button>
          <button
            onClick={() => setIsMonthPickerOpen(true)}
            className="flex flex-col items-center px-4 py-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <span className="text-sm font-bold text-white capitalize leading-none">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
            </span>
            <span className="text-[10px] text-gray-500 font-medium leading-none mt-1">
              {currentDate.getFullYear()}
            </span>
          </button>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <Icon name="chevron_right" />
          </button>
        </div>

        {/* Resumo do Mês e Filtros Rápidos */}
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <div
            onClick={() => setFilterType(filterType === 'income' ? 'all' : 'income')}
            className={`p-3 md:p-4 rounded-xl border text-center cursor-pointer transition-all active:scale-95 backdrop-blur-md ${filterType === 'income' ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'}`}
          >
            <p className="text-xs text-green-400 font-bold uppercase mb-1">Receitas</p>
            <p className="text-sm md:text-lg font-black text-green-300">{formatCurrency(totalIncome)}</p>
          </div>
          <div
            onClick={() => setFilterType(filterType === 'expense' ? 'all' : 'expense')}
            className={`p-3 md:p-4 rounded-xl border text-center cursor-pointer transition-all active:scale-95 backdrop-blur-md ${filterType === 'expense' ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'}`}
          >
            <p className="text-xs text-red-400 font-bold uppercase mb-1">Despesas</p>
            <p className="text-sm md:text-lg font-black text-red-300">{formatCurrency(totalExpense)}</p>
          </div>
          <div
            onClick={() => setFilterType('all')}
            className={`p-3 md:p-4 rounded-xl border text-center cursor-pointer transition-all active:scale-95 backdrop-blur-md ${filterType === 'all' ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_-5px_rgba(59,130,246,0.3)]' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'}`}
          >
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Balanço</p>
            <p className={`text-sm md:text-lg font-black ${balance >= 0 ? 'text-blue-300' : 'text-red-300'}`}>{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>

      {/* Barra de Busca e Ordenação */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none text-sm placeholder-gray-500"
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
          <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2">
            <span className="text-xs text-gray-400">De:</span>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-white text-sm outline-none [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2">
            <span className="text-xs text-gray-400">Até:</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-white text-sm outline-none [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
          {(dateRange.start || dateRange.end || selectedCategory !== 'Todas') && (
            <button
              onClick={() => { setDateRange({ start: '', end: '' }); setSelectedCategory('Todas'); }}
              className="text-xs text-teal-400 hover:text-teal-300 underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm border border-white/[0.05] overflow-hidden min-h-[300px]">

        {/* Versão Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.05] text-gray-400 font-medium border-b border-white/[0.05]">
              <tr>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td
                    onClick={() => handleTransactionClick(t)}
                    className="px-6 py-4 font-medium text-white cursor-pointer"
                  >
                    {t.description}
                    {t.installmentNumber && t.installments && (
                      <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                        {t.installmentNumber}/{t.installments}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-200">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{formatDate(t.date)}</td>
                  <td className={`px-6 py-4 text-right font-semibold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {t.isPaid ? (
                      <Icon name="check_circle" className="text-green-500 text-lg" />
                    ) : (
                      <Icon name="pending" className="text-gray-400 text-lg" />
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Icon name="event_busy" className="text-3xl opacity-50" />
                      <p>Nenhuma transação encontrada.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Versão Mobile */}
        <div className="md:hidden flex flex-col divide-y divide-white/[0.05]">
          {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
            <SwipeableTransactionItem
              key={t.id}
              transaction={t}
              onClick={() => handleTransactionClick(t)}
              onEdit={(e) => handleEdit(e, t.id)}
              onDuplicate={(e) => handleDuplicate(e, t.id)}
              onDelete={(e) => handleDelete(e, t.id)}
            />
          )) : (
            <div className="p-12 text-center text-gray-500">
              <Icon name="event_busy" className="text-3xl opacity-50 mb-2" />
              <p>Nenhuma transação encontrada.</p>
            </div>
          )}
        </div>
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
          onDelete={(id) => { deleteTransaction(id); setViewingTransaction(null); }}
          onDuplicate={(id) => { handleDuplicate({ stopPropagation: () => { } } as any, id); setViewingTransaction(null); }}
        />
      )}

      {isMonthPickerOpen && (
        <MonthYearPicker
          currentDate={currentDate}
          onSelect={setCurrentDate}
          onClose={() => setIsMonthPickerOpen(false)}
        />
      )}
    </div>
  );
};

// --- Subcomponents ---

const SwipeableTransactionItem: React.FC<{
  transaction: Transaction;
  onClick: () => void;
  onEdit: (e: React.TouchEvent | React.MouseEvent) => void;
  onDuplicate: (e: React.TouchEvent | React.MouseEvent) => void;
  onDelete: (e: React.TouchEvent | React.MouseEvent) => void;
}> = ({ transaction: t, onClick, onEdit, onDuplicate, onDelete }) => {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const SWIPE_THRESHOLD = -80;
  const MAX_SWIPE = -210;

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.targetTouches[0].clientX;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || startX.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - startX.current;

    if (diff < 0 && diff > (MAX_SWIPE - 20)) {
      setTranslateX(diff);
    } else if (diff > 0 && translateX < 0) {
      setTranslateX(Math.min(0, translateX + diff));
    }
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    startX.current = null;
    if (translateX < SWIPE_THRESHOLD) {
      setTranslateX(MAX_SWIPE);
    } else {
      setTranslateX(0);
    }
  };

  return (
    <div className="relative overflow-hidden select-none h-[76px]">
      <div className="absolute inset-y-0 right-0 w-[210px] flex z-0">
        <button onClick={onEdit} className="flex-1 bg-blue-600 text-white flex items-center justify-center active:bg-blue-700">
          <Icon name="edit" />
        </button>
        <button onClick={onDuplicate} className="flex-1 bg-gray-600 text-white flex items-center justify-center active:bg-gray-700">
          <Icon name="content_copy" />
        </button>
        <button onClick={onDelete} className="flex-1 bg-red-600 text-white flex items-center justify-center active:bg-red-700">
          <Icon name="delete" />
        </button>
      </div>

      <div
        className="relative z-10 bg-[#0f1216] w-full h-full flex items-center justify-between p-3 transition-transform duration-200 ease-out active:scale-[0.98]"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (translateX === 0) onClick(); else setTranslateX(0); }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            <Icon name={t.type === TransactionType.INCOME ? 'trending_up' : 'shopping_cart'} className="text-xl" />
          </div>
          <div className="flex flex-col min-w-0 gap-0.5">
            <p className="font-bold text-sm text-white truncate leading-tight">
              {t.description}
              {t.installmentNumber && t.installments && (
                <span className="ml-1 font-normal text-xs opacity-60">({t.installmentNumber}/{t.installments})</span>
              )}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 leading-tight">
              <span className="truncate max-w-[80px]">{t.category}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span>{formatDate(t.date)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 ml-2 gap-1">
          <p className={`font-extrabold text-sm ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
            {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(Math.abs(t.amount)).replace('R$', '')}
          </p>
          {t.isPaid && <Icon name="check_circle" className="text-green-500 text-base" />}
        </div>
      </div>
    </div>
  );
};

const NewTransactionModal: React.FC<{
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => void;
  cards: any[];
  accounts: any[];
  initialData?: Partial<Transaction & { transactionId?: string; receiver?: string }> | null;
}> = ({ onClose, onSave, cards, accounts, initialData }) => {
  const [tab, setTab] = useState<'expense' | 'income' | 'credit'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSourceId, setSelectedSourceId] = useState('');

  // Parcelamento (apenas para cartão)
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('2');

  // Detalhes extras
  const [transactionId, setTransactionId] = useState('');
  const [receiverName, setReceiverName] = useState('');

  // Recorrência
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceCount, setRecurrenceCount] = useState('12');

  useEffect(() => {
    if (initialData) {
      if (initialData.amount) setAmount(initialData.amount.toString());

      // Prioritize receiver for description if available, otherwise use generic description
      const descToUse = initialData.receiver || initialData.description || '';
      setDescription(descToUse);

      if (initialData.receiver) setReceiverName(initialData.receiver);
      if (initialData.transactionId) setTransactionId(initialData.transactionId);
      if (initialData.date) setDate(initialData.date);
      if (initialData.category) setCategory(initialData.category);

      setTab('expense');
    }
  }, [initialData]);

  // Seleção automática de conta/cartão ao mudar de aba
  useEffect(() => {
    if (tab === 'income' || tab === 'expense') {
      if (accounts.length > 0 && !accounts.find(a => a.id === selectedSourceId)) setSelectedSourceId(accounts[0].id);
    } else if (tab === 'credit') {
      if (cards.length > 0 && !cards.find(c => c.id === selectedSourceId)) setSelectedSourceId(cards[0].id);
    }
  }, [tab, accounts, cards, selectedSourceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Concatenar detalhes extras na descrição se houverem, já que não temos campos no DB para isso
    let finalDescription = description;
    if (transactionId && !finalDescription.includes(transactionId)) {
      finalDescription += ` (ID: ${transactionId.substring(0, 8)}...)`;
    }

    const newTransaction: Omit<Transaction, 'id'> = {
      description: finalDescription,
      amount: parseFloat(amount),
      date: date,
      type: tab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
      category,
      isPaid: tab !== 'credit', // Crédito não é pago imediatamente, vai pra fatura
      accountId: (tab === 'expense' || tab === 'income') ? selectedSourceId : undefined,
      cardId: tab === 'credit' ? selectedSourceId : undefined,
      installments: (tab === 'credit' && isInstallment) ? parseInt(installments) : 1
    };

    if (isRecurring && !transactionId) {
      const transactions: Omit<Transaction, 'id'>[] = [];
      const count = parseInt(recurrenceCount);
      const baseDate = new Date(date); // Use the selected date as start

      for (let i = 0; i < count; i++) {
        const newDate = new Date(baseDate);
        newDate.setMonth(baseDate.getMonth() + i);

        transactions.push({
          ...newTransaction,
          date: newDate.toISOString().split('T')[0],
          description: `${finalDescription} (${i + 1}/${count})`
        });
      }
      onSave(transactions);
    } else {
      onSave(newTransaction);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onMouseDown={onClose}
    >
      <div
        className="bg-[#1a1d24] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col my-4 max-h-[calc(100vh-120px)] overflow-hidden animate-scale-up ring-1 ring-white/5"
        onMouseDown={(e) => e.stopPropagation()}
      >

        <div className="px-4 py-3 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02] shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            {initialData && !initialData.transactionId && <Icon name="magic_button" className="text-teal-400 text-lg" />}
            {initialData && initialData.transactionId ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {initialData && (
          <div className="px-4 pt-2">
            <div className="bg-blue-500/20 text-blue-200 text-[10px] p-2 rounded-lg flex items-center gap-2">
              <Icon name="auto_awesome" className="text-sm" />
              <div>
                <p>Dados extraídos.</p>
                {receiverName && <p className="font-bold text-[10px]">Beneficiário: {receiverName}</p>}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
          {/* Seletor de Tipo (Tabs) */}
          <div className="flex p-1 bg-white/[0.05] rounded-xl">
            <button
              type="button"
              onClick={() => setTab('expense')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${tab === 'expense' ? 'bg-white/[0.1] text-red-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon name="trending_down" className="text-base" /> Despesa
            </button>
            <button
              type="button"
              onClick={() => setTab('income')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${tab === 'income' ? 'bg-white/[0.1] text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon name="trending_up" className="text-base" /> Receita
            </button>
            <button
              type="button"
              onClick={() => setTab('credit')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${tab === 'credit' ? 'bg-white/[0.1] text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon name="credit_card" className="text-base" /> Cartão
            </button>
          </div>

          {/* Valor */}
          <div>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm pl-3">R$</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-transparent border-b-2 border-white/[0.1] focus:border-teal-500 text-2xl font-black text-white placeholder:text-gray-600 outline-none transition-colors text-center"
              />
            </div>
          </div>

          {/* Descrição e Detalhes */}
          <div className="space-y-3 bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Descrição / Beneficiário</label>
              <input type="text" required placeholder="Ex: Almoço, Salário" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-white/[0.05] text-white text-sm focus:ring-1 focus:ring-teal-500/50 outline-none placeholder-gray-600" />
            </div>

            {(initialData || transactionId) && (
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">ID Transação (Opcional)</label>
                <input type="text" placeholder="ID Transação (Opcional)" value={transactionId} onChange={e => setTransactionId(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-xs text-gray-400 focus:ring-1 focus:ring-teal-500 outline-none font-mono" />
              </div>
            )}

            {/* Recorrência (Apenas para novas transações e não crédito) */}
            {!transactionId && tab !== 'credit' && (
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500/50 bg-gray-700 accent-teal-500"
                  />
                  <label htmlFor="recurring" className="text-xs text-gray-300 font-medium select-none cursor-pointer">
                    Repetir mensalmente
                  </label>
                </div>
                {isRecurring && (
                  <div className="flex items-center gap-2 ml-auto animate-fade-in">
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={recurrenceCount}
                      onChange={(e) => setRecurrenceCount(e.target.value)}
                      className="w-12 px-1 py-1 rounded bg-black/20 border border-white/[0.1] text-white text-xs text-center outline-none focus:border-teal-500"
                    />
                    <span className="text-[10px] text-gray-500">meses</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grid Categoria e Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Categoria</label>
              <Dropdown
                options={[
                  { label: 'Alimentação', value: 'Alimentação' },
                  { label: 'Transporte', value: 'Transporte' },
                  { label: 'Lazer', value: 'Lazer' },
                  { label: 'Moradia', value: 'Moradia' },
                  { label: 'Saúde', value: 'Saúde' },
                  { label: 'Transferência', value: 'Transferência' },
                  { label: 'Outros', value: 'Outros' },
                  { label: 'Salário', value: 'Salário' }
                ]}
                value={category}
                onChange={setCategory}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm text-white focus:ring-1 focus:ring-teal-500 outline-none" />
            </div>
          </div>

          {/* Seleção de Conta ou Cartão */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1">
              {tab === 'income' ? 'Conta de Destino' : (tab === 'credit' ? 'Selecione o Cartão' : 'Conta de Saída')}
            </label>
            <div className="relative">
              <Dropdown
                options={
                  (tab === 'income' || tab === 'expense')
                    ? (accounts.length > 0 ? accounts.map(acc => ({ label: `${acc.name} (${formatCurrency(acc.balance)})`, value: acc.id })) : [{ label: 'Nenhuma conta cadastrada', value: '' }])
                    : (cards.length > 0 ? cards.map(card => ({ label: `${card.name} (Final ${card.lastDigits})`, value: card.id })) : [{ label: 'Nenhum cartão cadastrado', value: '' }])
                }
                value={selectedSourceId}
                onChange={setSelectedSourceId}
                placeholder={tab === 'credit' ? 'Selecione o Cartão' : (tab === 'income' ? 'Conta de Destino' : 'Conta de Saída')}
                className="w-full"
              />
            </div>
          </div>

          {/* Parcelamento (Só aparece se for Cartão) */}
          {tab === 'credit' && (
            <div className="flex items-center gap-3 px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isInstallment ? 'bg-teal-500 border-teal-500' : 'border-gray-400'}`} onClick={() => setIsInstallment(!isInstallment)}>
                  {isInstallment && <Icon name="check" className="text-white text-xs" />}
                </div>
                <span className="text-xs font-medium text-gray-300">Parcelado</span>
              </label>
              {isInstallment && (
                <div className="flex-1 flex items-center gap-2 animate-fade-in">
                  <input type="number" min="2" max="36" value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-16 px-2 py-1 rounded bg-white/[0.05] border border-white/[0.1] text-sm text-center outline-none text-white" />
                  <span className="text-[10px] text-gray-500">x {formatCurrency(amount ? parseFloat(amount) / parseInt(installments) : 0)}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="py-2.5 rounded-lg font-bold text-sm text-gray-300 bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
            >
              Cancelar
            </button>
            <button type="submit" className={`py-2.5 rounded-lg font-bold text-sm text-white shadow-sm hover:shadow-md transition-all active:scale-95 ${tab === 'expense' ? 'bg-red-600' : tab === 'credit' ? 'bg-purple-600' : 'bg-green-600'}`}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetailsTransactionModal: React.FC<{
  transaction: Transaction;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
}> = ({ transaction, onClose, onDelete, onDuplicate }) => {
  const isExpense = transaction.type === TransactionType.EXPENSE;
  const colorClass = isExpense ? 'text-red-400' : 'text-green-400';
  const bgClass = isExpense ? 'bg-red-500/20' : 'bg-green-500/20';

  // Block scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleDelete = () => {
    if (window.confirm('Deseja realmente excluir esta transação?')) {
      onDelete(transaction.id);
    }
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#1a1d24] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/[0.08] ring-1 ring-white/5 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-8 bg-gradient-to-b ${isExpense ? 'from-red-500/10' : 'from-green-500/10'} to-transparent border-b border-white/[0.08] relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Icon name="close" className="text-xl" />
          </button>
          <div className="flex flex-col items-center gap-4">
            <div className={`size-16 rounded-full ${bgClass} flex items-center justify-center shadow-lg ring-1 ring-white/10`}>
              <Icon name={isExpense ? 'shopping_cart' : 'trending_up'} className={`text-3xl ${colorClass}`} />
            </div>
            <div className="text-center">
              <h2 className={`text-4xl font-bold ${colorClass} tracking-tight`}>
                {isExpense ? '-' : '+'} {formatCurrency(transaction.amount)}
              </h2>
              <p className="text-gray-400 text-sm mt-1 font-medium">{transaction.description}</p>
            </div>

            <div className="flex gap-2">
              {transaction.isPaid && (
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                  Efetivada
                </span>
              )}
              {transaction.installmentNumber && transaction.installments && (
                <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-xs font-medium border border-white/10">
                  Parcela {transaction.installmentNumber}/{transaction.installments}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
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
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-white/[0.08] grid grid-cols-3 gap-3 bg-white/[0.02]">
          <button
            onClick={handleEdit}
            className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-teal-500/5 text-teal-400 font-semibold hover:bg-teal-500/10 border border-teal-500/10 transition-all active:scale-95 group"
          >
            <Icon name="edit" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="text-xs">Editar</span>
          </button>
          <button
            onClick={handleDuplicate}
            className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-blue-500/5 text-blue-400 font-semibold hover:bg-blue-500/10 border border-blue-500/10 transition-all active:scale-95 group"
          >
            <Icon name="content_copy" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="text-xs">Copiar</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-red-500/5 text-red-400 font-semibold hover:bg-red-500/10 border border-red-500/10 transition-all active:scale-95 group"
          >
            <Icon name="delete" className="text-xl group-hover:scale-110 transition-transform" />
            <span className="text-xs">Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-gray-400"><Icon name={icon} /></div>
    <div>
      <p className="text-xs text-gray-400 uppercase font-bold tracking-wide">{label}</p>
      <p className="text-base text-white font-medium">{value}</p>
    </div>
  </div>
);

// --- Month/Year Picker Component ---
const MonthYearPicker: React.FC<{
  currentDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}> = ({ currentDate, onSelect, onClose }) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const pickerRef = useRef<HTMLDivElement>(null);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedYear, monthIndex, 1);
    onSelect(newDate);
    onClose();
  };

  const isCurrentMonth = (monthIndex: number) => {
    return currentDate.getMonth() === monthIndex && currentDate.getFullYear() === selectedYear;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={pickerRef}
        className="bg-[#0f1216]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-up ring-1 ring-white/5"
      >
        {/* Year Selector */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <Icon name="chevron_left" className="text-gray-300" />
          </button>
          <h3 className="text-xl font-bold text-white">{selectedYear}</h3>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <Icon name="chevron_right" className="text-gray-300" />
          </button>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <button
              key={month}
              onClick={() => handleMonthSelect(index)}
              className={`
                p-3 rounded-xl text-sm font-semibold transition-all
                ${isCurrentMonth(index)
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                  : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
                }
              `}
            >
              {month.substring(0, 3)}
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl bg-white/[0.05] text-gray-300 font-semibold hover:bg-white/[0.1] transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default Transactions;
