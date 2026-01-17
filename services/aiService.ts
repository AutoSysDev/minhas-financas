import { Transaction } from '../types';

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
  forecast: string;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function getAIAnalysis(
  transactions: Transaction[],
  monthName: string,
  totalBalance: number
): Promise<string> {
  // A chave continua sendo puxada do seu arquivo .env
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Chave API da OpenAI não configurada. Adicione VITE_OPENAI_API_KEY ao seu arquivo .env');
  }

  // Preparar um resumo compacto das transações
  const summary = transactions.reduce((acc, t) => {
    const category = t.category || 'Outros';
    if (!acc[category]) acc[category] = 0;
    acc[category] += t.type === 'INCOME' ? t.amount : -t.amount;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
    Analise os dados financeiros de ${monthName}:
    - Saldo Atual: R$ ${totalBalance.toFixed(2)}
    - Categorias: ${JSON.stringify(summary)}
    - Transações: ${transactions.length}

    Retorne em Markdown:
    1. Resumo do mês.
    2. Projeção de saldo.
    3. Três dicas práticas.
    Tom: Profissional e motivador. Idioma: PT-BR.
  `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // Atualizado para o modelo GPT-5 Nano
        model: 'gpt-5-nano', 
        messages: [
          { 
            role: 'system', 
            content: 'Você é um consultor financeiro sênior especializado em economia doméstica.' 
          },
          { role: 'user', content: prompt }
        ],
        // Temperatura 0.3 é melhor para análises financeiras (evita "alucinações" nos números)
        temperature: 0.3,
        // Opcional: define um limite para economizar ainda mais
        max_tokens: 800 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro ao conectar com o GPT-5 Nano');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw error;
  }
}