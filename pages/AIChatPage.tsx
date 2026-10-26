import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useTheme } from '../context/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
}

const AIChatPage: React.FC = () => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou seu assistente financeiro. Como posso ajudar com suas dúvidas sobre investimentos ou economia hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTokens, setSessionTokens] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: userMsg.content,
          transactions: [], // Página de chat geral pode não ter transações específicas ou podemos carregar depois
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Muitas requisições. Por favor, aguarde alguns segundos.');
        }
        const data = await response.json();
        throw new Error(data.error || 'Erro ao conectar com o servidor.');
      }

      const data = await response.json();

      if (data.status === 'success') {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        throw new Error('Resposta inválida do servidor.');
      }

    } catch (err: any) {
      setError(err.message);
      // Remove user message if failed? Or just show error.
      // Showing error is better.
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col ${isLight ? 'bg-gray-50' : 'bg-[#0f1216]'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 px-4 py-3 border-b flex items-center justify-between backdrop-blur-md ${isLight ? 'bg-white/80 border-gray-200' : 'bg-[#0f1216]/80 border-white/5'}`}>
        <div className="flex items-center gap-3">
          <Link to="/" className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-gray-100 text-slate-600' : 'hover:bg-white/10 text-gray-400'}`}>
            <Icon name="arrow_back" className="text-xl" />
          </Link>
          <div>
            <h1 className={`font-bold text-lg leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Consultoria Financeira IA
            </h1>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
              Tire dúvidas pontuais sobre suas finanças
            </p>
          </div>
        </div>

        {/* Token Indicator */}
        <div className={`flex flex-col items-end text-xs ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
          <div className="flex items-center gap-1">
            <Icon name="token" className="text-teal-500 text-sm" />
            <span className="font-medium">Tokens Sessão: {sessionTokens}</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                  ? isLight
                    ? 'bg-teal-600 text-white rounded-br-none'
                    : 'bg-teal-600 text-white rounded-br-none'
                  : isLight
                    ? 'bg-white text-slate-700 border border-gray-100 rounded-bl-none'
                    : 'bg-white/5 text-gray-200 border border-white/5 rounded-bl-none'
                }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.tokens && (
                <div className={`text-[10px] mt-1 opacity-60 text-right ${msg.role === 'user' ? 'text-teal-100' : 'text-gray-400'}`}>
                  {msg.tokens} tokens
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`rounded-2xl px-4 py-3 rounded-bl-none ${isLight ? 'bg-white' : 'bg-white/5'}`}>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 text-red-500 text-xs px-3 py-1.5 rounded-full border border-red-500/20">
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className={`p-4 border-t ${isLight ? 'bg-white border-gray-200' : 'bg-[#0f1216] border-white/5'}`}>
        <div className="max-w-4xl mx-auto relative flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Como investir 1000 reais? ou Como economizar no mercado?"
            disabled={isLoading}
            className={`flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all ${isLight
                ? 'bg-gray-100 text-slate-900 placeholder-gray-400 border-transparent'
                : 'bg-white/5 text-white placeholder-gray-500 border-white/5 border'
              }`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isLight
                ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20'
                : 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/20'
              }`}
          >
            <Icon name="send" className="text-lg" />
          </button>
        </div>
        <p className={`text-center text-[10px] mt-2 ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>
          A IA pode cometer erros. Verifique informações importantes. Limite: 1 pergunta a cada 3s.
        </p>
      </footer>
    </div>
  );
};

export default AIChatPage;
