
const STORAGE_KEY = 'minhas_financas_v1';

export const storageService = {
  save: (key: string, data: any) => {
    try {
      const currentData = storageService.loadAll();
      const newData = { ...currentData, [key]: data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Erro ao salvar dados', error);
    }
  },

  loadAll: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erro ao carregar dados', error);
      return {};
    }
  },
  
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
