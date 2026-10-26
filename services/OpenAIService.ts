
import { Category } from '../types';

interface CategorizationResult {
  categoryName: string;
  cleanDescription: string;
  tags: string[];
  confidence: number;
}

export class OpenAIService {
  private static apiKey: string | undefined = import.meta.env.VITE_OPENAI_API_KEY;

  /**
   * Verifica se a API Key está configurada
   */
  static isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Analisa a descrição da transação e sugere categoria, nome limpo e tags
   */
  static async categorizeTransaction(
    description: string,
    availableCategories: Category[]
  ): Promise<CategorizationResult | null> {
    if (!this.isConfigured()) {
      console.warn('OpenAI API Key não configurada');
      return null;
    }

    if (!description || description.length < 3) return null;

    const categoryNames = availableCategories.map(c => c.name).join(', ');

    const prompt = `
      Analise a seguinte descrição de transação bancária: "${description}".
      
      Tarefas:
      1. Identifique a melhor categoria entre estas opções: [${categoryNames}]. Se nenhuma se encaixar perfeitamente, escolha a mais próxima ou "Outros".
      2. Limpe o nome da transação para um formato legível (ex: "UBER *TRIP 123" -> "Uber").
      3. Sugira até 3 tags curtas para classificar essa despesa (ex: #transporte, #app).
      
      Responda APENAS com um JSON neste formato, sem markdown:
      {
        "categoryName": "string",
        "cleanDescription": "string",
        "tags": ["string"],
        "confidence": number (0-1)
      }
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Usando 3.5-turbo por ser mais rápido e barato para essa tarefa simples
          messages: [
            { role: 'system', content: 'Você é um assistente financeiro especializado em categorização de despesas brasileiras.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3, // Baixa temperatura para respostas mais consistentes
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) return null;

      try {
        // Tenta fazer parse do JSON (lidando com possíveis blocos de código markdown)
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanContent) as CategorizationResult;
        
        // Valida se a categoria retornada realmente existe
        const matchCategory = availableCategories.find(
          c => c.name.toLowerCase() === result.categoryName.toLowerCase()
        );

        if (matchCategory) {
          result.categoryName = matchCategory.name; // Normaliza o nome
        }

        return result;
      } catch (e) {
        console.error('Erro ao fazer parse da resposta da IA', e);
        return null;
      }

    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error);
      return null;
    }
  }
}
