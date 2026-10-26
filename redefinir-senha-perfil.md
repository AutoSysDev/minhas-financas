# Plano: Adicionar Redefinição de Senha em "Meu Perfil"

Este plano detalha a inclusão da funcionalidade de redefinição de senha diretamente na aba de Perfil do usuário, permitindo que ele altere sua senha sem precisar sair da seção de configurações.

## Contexto
- **Localização Atual:** A funcionalidade de alteração de senha existe na aba "Segurança" (`Settings.tsx`).
- **Objetivo:** Adicionar um atalho ou seção de "Segurança da Conta" dentro da `ProfileTab.tsx` para melhorar a experiência do usuário (UX).
- **Tecnologia:** Supabase Auth (`updateUser`).

## Etapas de Implementação

### 1. Preparação da Interface em `ProfileTab.tsx`
- Adicionar uma nova seção (Card) abaixo dos "Dados Pessoais".
- Incluir campos de input: "Nova Senha" e "Confirmar Nova Senha".
- Adicionar um botão de ação "Atualizar Senha".

### 2. Lógica de Alteração de Senha
- Implementar a função `handleUpdatePassword` usando `supabase.auth.updateUser({ password: newPassword })`.
- Adicionar validações:
  - Senha com no mínimo 6 caracteres.
  - Confirmação de senha deve ser idêntica à nova senha.
- Exibir feedbacks via `toast` (sucesso/erro).

### 3. Sincronização e Limpeza
- Limpar os campos de senha após o sucesso da operação.
- Garantir que o estado de `loading` seja gerenciado corretamente durante a chamada à API.

## Verificação
- [ ] Tentar alterar a senha com campos vazios (deve falhar).
- [ ] Tentar alterar a senha com menos de 6 caracteres (deve falhar).
- [ ] Tentar alterar a senha com confirmação incorreta (deve falhar).
- [ ] Alterar a senha com sucesso e verificar o feedback visual.
- [ ] Validar o comportamento em dispositivos móveis (responsividade).

## Scripts de Auditoria Sugeridos
- `ux_audit.py c:\monelyfinance\components\Settings\ProfileTab.tsx`
- `security_scan.py` (se disponível para validar chamadas de auth)
