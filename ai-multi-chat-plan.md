# Multi-Chat AI Copilot com Auto-Limpeza

## Goal
Implementar navegação entre múltiplos chats no modal de IA, com histórico persistente por 5 minutos e limpeza automática após esse período.

## Tasks
- [ ] **Definir Estrutura de Dados**: Criar interface `ChatSession` com `id`, `title`, `messages` e `timestamp` em `AIAnalysisModal.tsx`. → Verify: Interface definida no código.
- [ ] **Gerenciamento de Estado**: Alterar o estado único de `messages` para um array de `ChatSession` e um `activeChatId`. → Verify: Estado inicializa corretamente com um chat padrão ou chats carregados.
- [ ] **Persistência Local**: Implementar hooks de `useEffect` para salvar e carregar o estado dos chats no `localStorage`. → Verify: Ao atualizar a página, os chats ativos permanecem no modal.
- [ ] **Lógica de Expiração (5 min)**: Adicionar função de limpeza no carregamento do modal que remove chats com `timestamp` superior a 5 minutos. → Verify: Criar chat manual com timestamp antigo e confirmar que ele desaparece ao abrir o modal.
- [ ] **Interface de Navegação**: Adicionar uma barra lateral ou menu superior no modal para alternar entre chats e criar "Novo Chat". → Verify: Clique em um chat na lista troca o conteúdo exibido e permite continuar a conversa.
- [ ] **Refatoração do Envio**: Atualizar `handleSend` para injetar a resposta da IA no chat correto dentro do array de sessões. → Verify: Respostas aparecem apenas no chat ativo.

## Done When
- [ ] O usuário consegue criar múltiplos chats independentes.
- [ ] É possível alternar entre chats sem perder o histórico (dentro da janela de 5 min).
- [ ] Chats com mais de 5 minutos são removidos automaticamente ao abrir o modal.
- [ ] O histórico é salvo no navegador do usuário.

## Notes
- A limpeza de 5 minutos será feita no lado do cliente (Frontend) verificando o timestamp de criação/última mensagem da sessão.
- O backend continuará sem estado (stateless), recebendo o histórico completo da sessão ativa a cada requisição.
