import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
  monthName: string;
}

const STORAGE_KEY = 'monely_ai_chats';
const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutos

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
  transactions,
  monthName
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const createNewSession = (initialMessages?: Message[]) => {
    const id = Date.now().toString();
    const newSession: ChatSession = {
      id,
      title: `Conversa ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
      messages: initialMessages || [
        {
          role: 'assistant',
          content: `Olá! Sou seu assistente financeiro da Monely Finance. Tenho acesso aos seus dados de **${monthName}** (${transactions.length} transações). Como posso ajudar você hoje?`
        }
      ],
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Carregar e limpar chats expirados
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed: ChatSession[] = JSON.parse(saved);
          const now = Date.now();
          const validSessions = parsed.filter(s => now - s.timestamp < EXPIRATION_TIME);

          if (validSessions.length > 0) {
            setSessions(validSessions);
            setActiveSessionId(validSessions[0].id);
          } else {
            createNewSession();
          }
        } catch (e) {
          console.error('Failed to parse saved chats', e);
          createNewSession();
        }
      } else {
        createNewSession();
      }
    }
  }, [isOpen]);

  // Salvar chats
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);

    if (filtered.length === 0) {
      createNewSession();
    } else if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !activeSessionId) return;

    const userMessage = input.trim();
    setInput('');

    // Atualizar mensagens localmente
    const updatedMessages: Message[] = [...(activeSession?.messages || []), { role: 'user', content: userMessage }];

    setSessions(prev => prev.map(s =>
      s.id === activeSessionId
        ? { ...s, messages: updatedMessages, timestamp: Date.now() }
        : s
    ));

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          transactions: transactions,
          history: activeSession?.messages || []
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setSessions(prev => prev.map(s =>
          s.id === activeSessionId
            ? { ...s, messages: [...updatedMessages, { role: 'assistant', content: data.response }], timestamp: Date.now() }
            : s
        ));
      } else {
        setSessions(prev => prev.map(s =>
          s.id === activeSessionId
            ? { ...s, messages: [...updatedMessages, { role: 'assistant', content: 'Ops, tive um problema ao processar sua pergunta. Pode tentar novamente?' }], timestamp: Date.now() }
            : s
        ));
      }
    } catch (error) {
      console.error('Chat error:', error);
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId
          ? { ...s, messages: [...updatedMessages, { role: 'assistant', content: 'Não consegui conectar ao servidor de IA. Verifique se o servidor local está rodando.' }], timestamp: Date.now() }
          : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Copiloto Financeiro IA"
      maxWidth="max-w-5xl"
      headerLeft={
        <button
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl transition-all active:scale-95 touch-manipulation flex"
          title={isSidebarVisible ? "Ocultar histórico" : "Mostrar histórico"}
          style={{ minWidth: '48px', minHeight: '48px' }}
        >
          <Icon name={isSidebarVisible ? "menu_open" : "menu"} className="text-2xl" />
        </button>
      }
    >
      <div className="flex h-[80vh] md:h-[600px] overflow-hidden relative">
        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: isSidebarVisible ? (window.innerWidth < 768 ? '100%' : 280) : 0,
            opacity: isSidebarVisible ? 1 : 0,
            x: isSidebarVisible ? 0 : -20
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`${isSidebarVisible && window.innerWidth < 768 ? 'absolute inset-0 z-[60]' : 'relative'} border-r border-white/5 flex flex-col bg-gray-900/95 backdrop-blur-xl overflow-hidden`}
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Histórico</h2>
          </div>

          <div className="p-4">
            <button
              onClick={() => {
                createNewSession();
                if (window.innerWidth < 768) setIsSidebarVisible(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl transition-all text-sm font-bold shadow-lg shadow-teal-600/20 active:scale-95 touch-manipulation"
              style={{ minHeight: '56px' }}
            >
              <Icon name="add" className="text-xl" />
              Novo Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/5">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (window.innerWidth < 768) setIsSidebarVisible(false);
                }}
                className={`w-full text-left px-4 py-4 rounded-2xl transition-all group relative active:scale-[0.98] touch-manipulation ${activeSessionId === session.id
                  ? 'bg-teal-600/10 text-teal-400 border border-teal-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                  }`}
                style={{ minHeight: '72px' }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeSessionId === session.id ? 'bg-teal-500/20' : 'bg-white/5'}`}>
                    <Icon name="chat" className={`text-xl ${activeSessionId === session.id ? 'text-teal-400' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{session.title}</p>
                    <p className="text-xs opacity-50 truncate">
                      {new Date(session.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded-lg transition-all"
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <Icon name="delete" className="text-lg" />
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-900/50 relative">
          {/* Header/Toolbar */}
          <div className="h-16 border-b border-white/5 flex items-center px-4 justify-between bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-bold text-white truncate">
                  {activeSession?.title || 'Selecione uma conversa'}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-medium text-teal-400 uppercase tracking-widest">IA Ativa</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-teal-500/20">
            <AnimatePresence initial={false}>
              {activeSession?.messages.map((msg, index) => (
                <motion.div
                  key={`${activeSession.id}-${index}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[75%] p-4 md:p-5 rounded-2xl md:rounded-3xl text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-sm transition-all ${msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-tr-none shadow-teal-600/10'
                      : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                      }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-4 pb-6 md:pb-4 border-t border-white/5 bg-gray-900/80 backdrop-blur-md">
            <div className="flex gap-3 max-w-4xl mx-auto w-full">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte algo..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm md:text-base text-white focus:outline-none focus:border-teal-500/50 transition-all placeholder:text-gray-500 focus:bg-white/10"
                style={{ minHeight: '56px' }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-14 h-14 flex items-center justify-center bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 text-white rounded-2xl transition-all shadow-lg shadow-teal-600/20 active:scale-90 touch-manipulation flex-shrink-0"
              >
                <Icon name="send" className="text-2xl" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal >
  );
};
