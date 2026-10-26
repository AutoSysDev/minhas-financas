interface Category {
    id: string;
    name: string;
    type: 'expense' | 'income';
}

interface CategorizationResult {
    categoryName: string;
    cleanDescription: string;
    confidence: float;
}

class LocalAIService {
    private static API_URL = 'http://localhost:8000';

    static async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.API_URL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    static async categorizeTransaction(
        description: string, 
        availableCategories: Category[]
    ): Promise<CategorizationResult | null> {
        try {
            const categoryNames = availableCategories.map(c => c.name);
            
            const response = await fetch(`${this.API_URL}/categorize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description,
                    categories: categoryNames
                })
            });

            if (!response.ok) {
                throw new Error('Falha na requisição ao servidor local');
            }

            const data = await response.json();
            
            return {
                categoryName: data.category,
                cleanDescription: data.clean_description,
                confidence: data.confidence
            };
        } catch (error) {
            console.error('Erro ao categorizar com IA Local:', error);
            return null;
        }
    }
}

export default LocalAIService;
