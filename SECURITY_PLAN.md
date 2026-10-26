# Plano de Segurança Abrangente - Monely Finance

Este documento detalha a análise de segurança realizada no projeto Monely Finance e define o plano de ação implementado para garantir a proteção de dados e a integridade do sistema, seguindo o Modelo de Controle de Privilégios (MCP).

## 1. Visão Geral
O projeto utiliza uma arquitetura moderna e segura por padrão:
- **Frontend**: React (Vite) com proteção automática contra XSS.
- **Backend/Database**: Supabase (PostgreSQL) com Row Level Security (RLS).
- **Mobile**: Capacitor (Android).

## 2. Análise de Vulnerabilidades e Correções

### 2.1. Banco de Dados e RLS (Supabase)
**Status:** ✅ Seguro e Reforçado
**Ações Realizadas:**
- Criado script de hardening (`supabase/migrations/20260118_security_hardening.sql`) para garantir que RLS esteja ativado em **todas** as tabelas.
- Verificadas e reforçadas políticas de acesso para tabelas críticas (`transactions`, `accounts`, `investments`, `profiles`).
- Política de "Negar por Padrão" garantida pela ativação do RLS sem políticas permissivas genéricas.

### 2.2. Atualização do Aplicativo (App Update)
**Status:** ✅ Resolvido
**Vulnerabilidade Anterior:** Falta de verificação de integridade no download do APK.
**Solução Implementada:**
- **Verificação de Hash SHA-256:** O hook `useAppUpdate` agora calcula o hash do arquivo baixado e o compara com o hash fornecido no `version.json`.
- **Interrupção de Instalação:** Se o hash não corresponder, a atualização é abortada, prevenindo ataques de Man-in-the-Middle ou arquivos corrompidos.

### 2.3. Validação de Entrada
**Status:** ✅ Padronizado
**Solução Implementada:**
- Instalada biblioteca `zod` para validação de esquemas robusta.
- Criado utilitário centralizado `src/utils/validation.ts` com esquemas reutilizáveis para:
  - Autenticação (Email, Senha Forte).
  - Transações (Valores positivos, datas válidas).
  - Prevenção de injeção de dados inválidos.

## 3. Medidas de Segurança em Camadas (Defesa em Profundidade)

### 3.1. Autenticação e Autorização
- **Sessão:** Gerenciada pelo Supabase Auth (JWT). Tokens são renovados automaticamente e armazenados de forma segura.
- **RLS:** A autorização é feita no nível do dado (Database), não apenas na aplicação, garantindo que mesmo se a API for acessada diretamente, o usuário só vê seus dados.

### 3.2. Proteção de Dados
- **Criptografia em Repouso:** Dados no Supabase são criptografados pelo provedor.
- **Criptografia em Trânsito:** Todas as conexões (API e Banco) exigem TLS (SSL).
- **Dados Sensíveis:** Senhas nunca são armazenadas em texto plano (hashing gerenciado pelo Supabase Auth).

### 3.3. Proteção contra Código Malicioso (XSS/Injection)
- **React:** Escapa automaticamente conteúdo renderizado, prevenindo XSS básico.
- **Content Security Policy (CSP):** Recomendado configurar no servidor web de produção (Vercel/Netlify).

## 4. Plano de Resposta a Incidentes

1.  **Identificação:** Monitorar logs de erro (atualmente integrados no `ErrorBoundary` e notificações de erro).
2.  **Contenção:**
    - Revogar chaves de API comprometidas no Dashboard do Supabase.
    - Pausar o projeto no Supabase se houver vazamento massivo.
3.  **Erradicação:**
    - Corrigir a vulnerabilidade no código.
    - Gerar nova versão com correção.
    - Forçar atualização via mecanismo de "App Update".
4.  **Recuperação:** Restaurar dados de backups (Supabase PITR) se necessário.
5.  **Pós-Incidente:** Atualizar este plano e realizar post-mortem.

## 5. Práticas de Codificação Segura (Guia para Desenvolvedores)

- **Nunca** commitar chaves de serviço (`service_role`) no código frontend. Use apenas a `anon_key`.
- **Sempre** habilitar RLS ao criar uma nova tabela.
- **Utilizar** `src/utils/validation.ts` para validar qualquer entrada de usuário antes de enviar ao backend.
- **Hash Verification:** Nunca remover a verificação de hash do mecanismo de update.
- **Revisar** dependências npm periodicamente (`npm audit`) para evitar vulnerabilidades na cadeia de suprimentos.

---
**Data da Análise:** 18/01/2026
**Responsável:** Trae AI Senior Pair-Programmer
