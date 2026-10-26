# Monely Finance — Mobile / PWA (iOS)

Documento de referência do ajuste mobile: o que foi feito, como instalar no iPhone e o que validar.

---

## 1. O que é

O Monely Finance agora é um **PWA instalável**. No iPhone ele é adicionado à Tela de Início pelo Safari e abre em tela cheia, sem barra do navegador — sem App Store e sem Mac.

Não é um app nativo. Limitações reais da plataforma:

| Recurso | No iPhone (PWA) |
|---|---|
| Instalação | Safari → Compartilhar → Adicionar à Tela de Início |
| Abrir offline (shell) | Sim |
| Ler dados já carregados | Sim (enquanto o app estiver aberto) |
| Criar/editar transações | Exige conexão |
| Push notifications | Somente iOS 16.4+ e com o app instalado (não habilitado neste ciclo) |
| Sincronização em background | Não existe no iOS |
| Pagamentos (Stripe) | Abre no Safari, fora do app |

---

## 2. Instalar no iPhone

1. Abra **Safari** (precisa ser o Safari, não o Chrome).
2. Acesse `https://monelyfinance.vercel.app`.
3. Toque em **Compartilhar** (ícone de quadrado com seta).
4. Toque em **Adicionar à Tela de Início**.
5. Confirme em **Adicionar**.

O app aparece com o ícone do Monely e abre em tela cheia.

Para atualizar: abra o app. Quando houver versão nova, aparece o aviso **“Nova versão disponível”** com o botão **Atualizar**. A troca nunca acontece sozinha no meio de um lançamento.

---

## 3. O que mudou no código

### PWA

- `vite-plugin-pwa` com `registerType: 'prompt'` + `workbox-window`.
- Manifest: `pt-BR`, `standalone`, `portrait`, tema `#0f1216`, ícones 192/512 + maskable.
- Ícones: `public/apple-touch-icon.png` (180×180) e `public/maskable-512.png`.
- `vercel.json`: `no-cache` no `sw.js` e no manifest; assets com cache imutável.
- Rewrites do SPA removidos (o app usa `HashRouter`, então `/sw.js`, manifest e `/api` não são engolidos).

### Regra de ouro do service worker

| Origem | Estratégia |
|---|---|
| `*.supabase.co` | **NetworkOnly** — nunca cacheia dado financeiro |
| `/api/*` | **NetworkOnly** |
| Shell (JS/CSS/HTML/ícones) | Precache |
| Fontes do Google | StaleWhileRevalidate / CacheFirst |
| Imagens | CacheFirst (30 dias) |

### iOS / Safari

- `viewport-fit=cover` + utilitários de safe area (`pt-safe`, `pb-safe`, `bottom-safe`, `right-safe`).
- `100dvh` no lugar de `h-screen` (corrige o salto com a barra de endereço do Safari).
- Inputs com 16px no mobile — elimina o zoom automático ao focar.
- Modais viram **bottom sheet** no celular, com trava de scroll e fechamento por `Esc`.
- Menu lateral mantido: fechar com botão, `Esc`, clique no fundo e ao trocar de rota.
- Alvos de toque de 44px nos controles de ícone (menu, tema, privacidade, notificações, fechar).
- Blobs animados e `blur` pesados desativados no mobile; `prefers-reduced-motion` respeitado.
- Faixa **“Sem conexão”** no topo quando a rede cai.

### Performance

- `console.log/debug/info` removidos do bundle de produção (`esbuild.pure`); `console.error` mantido.
- Vendor separado em chunks (`react`, `supabase`, `framer-motion`) para melhorar cache entre deploys.
- APK e favicon 1024px fora do precache.

---

## 4. Checklist de validação

### No Mac/Windows (antes de publicar)

- [x] `npm run build` sem erros
- [x] `dist/sw.js` e `dist/manifest.webmanifest` gerados
- [ ] `npx serve dist` → abrir no Chrome, aba Application:
  - [ ] Manifest: nome, ícones 192/512/maskable, `display: standalone`
  - [ ] Service Worker: ativo, sem erros
  - [ ] Cache Storage: sem nenhuma URL `supabase.co`
- [ ] Lighthouse mobile → “Installable” + Performance ≥ 85
- [ ] DevTools modo offline → recarregar → app abre com o shell

### No iPhone (Safari)

- [ ] Login funciona
- [ ] Instalar pela Tela de Início e abrir pelo ícone (sem barra do Safari)
- [ ] Nenhum conteúdo sob o notch nem sob a home indicator
- [ ] Menu lateral abre, fecha pelo botão, pelo fundo e ao trocar de rota
- [ ] Formulários não dão zoom ao focar
- [ ] Teclado não cobre o campo focado nos modais
- [ ] Modais sobem como bottom sheet
- [ ] Valores formatados não estouram as colunas em 375px
- [ ] Sem scroll horizontal em nenhuma tela
- [ ] Ativar modo avião → recarregar → faixa “Sem conexão” aparece e o shell abre
- [ ] Voltar a rede → aviso desaparece

### Depois do deploy

- [ ] `https://monelyfinance.vercel.app/manifest.webmanifest` responde 200
- [ ] `https://monelyfinance.vercel.app/sw.js` responde 200 com `Cache-Control: max-age=0`
- [ ] Login, logout e “Esqueci a senha” funcionam dentro do app instalado
- [ ] `/api/chat` continua respondendo

---

## 5. Fora do escopo deste ciclo

- App nativo iOS (exige macOS + Xcode + Apple Developer).
- Push notifications no iOS.
- Fila de escrita offline (lançar transação sem internet).
- Alterações de schema, RLS ou edge functions.

---

## 6. Ponto de atenção

O arquivo `components/Settings/ProfileTab.tsx` estava vazio (0 bytes) e era importado por `pages/Settings.tsx`, o que quebrava o build. O bloco original do perfil foi restaurado dentro de `pages/Settings.tsx` e o arquivo vazio removido. A extração para componente pode ser refeita depois, com o conteúdo real.
