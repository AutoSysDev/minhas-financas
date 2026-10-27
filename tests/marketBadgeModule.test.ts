import { describe, it, expect } from 'vitest';
import { InvestorLevelBadge, SimpleLevelBadge } from '../components/Market/InvestorLevelBadgeImpl';

// Regressão: uma linha solta no topo do arquivo (fora de comentário) fazia o
// módulo lançar "ReferenceError: components is not defined" ao ser carregado,
// derrubando a tela de Resumo com o ErrorBoundary.
describe('InvestorLevelBadgeImpl', () => {
  it('carrega o módulo e exporta os badges', () => {
    expect(InvestorLevelBadge).toBeTypeOf('function');
    expect(SimpleLevelBadge).toBeTypeOf('function');
  });
});
