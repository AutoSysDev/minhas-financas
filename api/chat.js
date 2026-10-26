import { OpenAI } from 'openai';

export const config = {
  runtime: 'edge',
};

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { query, transactions, history } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Preparar o contexto das transações para a IA
    const transactionsContext = transactions && transactions.length > 0 
      ? `\n\nTransações do usuário para análise:\n${JSON.stringify(transactions.slice(0, 50), null, 2)}`
      : '\n\nNão há transações disponíveis para análise no momento.';

    const systemPrompt = `Você é um assistente financeiro pessoal sênior da Monely Finance.
Sempre responda em Português do Brasil de forma amigável, profissional e objetiva.
Ao falar de valores, use o formato R$ X.XXX,XX.
Se o usuário perguntar algo que não pode ser respondido com os dados, explique educadamente.

As transações do usuário são fornecidas abaixo. Use-as para responder perguntas sobre gastos, categorias, tendências e economia.
Colunas disponíveis nas transações: date, description, amount, category, type (INCOME/EXPENSE).${transactionsContext}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: query }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = response.choices[0].message.content;

    return new Response(JSON.stringify({
      status: 'success',
      response: aiResponse
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
