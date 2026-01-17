# Monely Finance - Design System Documentation

Este documento descreve os padrões de design e elementos de front-end utilizados no projeto Monely Finance. Esta documentação serve como guia para o desenvolvimento de novas interfaces, incluindo a futura landing page.

## 1. Visão Geral
O sistema de design é construído sobre o framework **Tailwind CSS**, utilizando uma abordagem "mobile-first" e suporte nativo a modo escuro (Dark Mode). O design prioriza uma estética moderna, limpa e funcional, com forte uso de contrastes para legibilidade.

- **Framework CSS**: Tailwind CSS
- **Modo Escuro**: Ativado via classe (`class` strategy)
- **Fonte Principal**: Manrope

## 2. Tipografia

A tipografia principal é a **Manrope**, uma fonte sans-serif moderna e geométrica.

### Família de Fontes
- **Principal (Display)**: 'Manrope', sans-serif
- **Backup**: sans-serif

### Pesos e Estilos
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **SemiBold**: 600
- **Bold**: 700
- **ExtraBold**: 800

### Hierarquia (Exemplos)
| Elemento | Tamanho (Tailwind) | Peso | Uso Comum |
|----------|-------------------|------|-----------|
| H1 | `text-2xl` a `text-4xl` | Bold/ExtraBold | Títulos de páginas, Hero sections |
| H2 | `text-xl` a `text-2xl` | Bold | Subtítulos de seções |
| H3 | `text-lg` | Bold | Títulos de cards |
| Body | `text-base` | Regular | Texto corrido |
| Small | `text-sm` | Medium/Regular | Legendas, detalhes secundários |
| Tiny | `text-xs` | Medium | Labels, tags, metadados |

## 3. Cores

### Paleta Principal (Tailwind Config)
| Nome | Hex | Uso |
|------|-----|-----|
| `primary` | `#137fec` | Ações principais, destaques, links |
| `success` | `#16a34a` | Confirmações, receitas positivas |
| `background-light` | `#f6f7f8` | Fundo principal (Light Mode) |
| `background-dark` | `#101922` | Fundo principal (Dark Mode) |

### Cores de Interface (Contextual)
O sistema utiliza extensivamente as cores do Tailwind (`teal`, `red`, `blue`, `gray`).

- **Ações / Brand**: `teal-500` (#14b8a6) - Muito utilizado em botões e destaques.
- **Receitas (Income)**: `green-500` / `green-400`
- **Despesas (Expense)**: `red-500` / `red-400`
- **Texto (Dark Mode)**: 
  - Primário: `text-white`
  - Secundário: `text-gray-300`
  - Terciário: `text-gray-400`
  - Muted: `text-gray-500`
- **Bordas (Dark Mode)**: `border-white/[0.05]` ou `border-white/[0.1]` (Opacidade)
- **Fundos de Componentes (Dark Mode)**: `bg-white/[0.05]` ou `bg-[#0f1216]`

### Gradientes
O uso de gradientes é sutil, geralmente em elementos de destaque ou fundos de cards especiais.
- Exemplo: `bg-gradient-to-r from-teal-500/10 to-transparent`

## 4. Ícones

### Biblioteca
- **Sistema**: SVG Customizado (`Icon.tsx`) e Material Symbols Outlined (Google Fonts).
- **Componente**: `<Icon name="nome_do_icone" className="..." />`

### Padrões
- **Tamanho Padrão**: `text-xl` (20px) ou `text-2xl` (24px).
- **Estilo**: Outline / Stroke (2px).
- **Renderização**: SVGs inline para controle total de cor (`currentColor`) e tamanho.

### Ícones de Categoria (Naming Convention)
Os ícones de categoria seguem o prefixo `cat_` para fácil identificação e mapeamento.
- Ex: `cat_food`, `cat_car`, `cat_health`.

## 5. Efeitos e Animações

### Transições
A maioria dos elementos interativos possui transição suave de cores e opacidade.
- **Duração Padrão**: `duration-200` ou `duration-300`.
- **Timing**: `ease-out`.

### Animações Customizadas (Tailwind Config)
| Nome | Classe | Descrição |
|------|--------|-----------|
| **Fade In** | `animate-fade-in` | Opacidade 0 -> 1 com leve movimento vertical. |
| **Slide Up** | `animate-slide-up` | Desliza de baixo para cima (100% -> 0). |
| **Scale Up** | `animate-scale-up` | Aumenta escala (0.95 -> 1) com fade. |
| **Shimmer** | `animate-shimmer` | Efeito de carregamento (esqueleto). |

### Sombras e Overlays
- **Modo Escuro**: Sombras são menos utilizadas em favor de bordas sutis e diferenciação de fundo (`bg-white/[0.05]`).
- **Glow**: Efeitos de brilho utilizando `shadow-[0_0_10px_rgba(...)]` ou `drop-shadow`.

### Efeitos Especiais
- **Privacy Mode**: Blur em valores sensíveis (`filter: blur(6px)`).
- **Glassmorphism**: Uso de fundos com opacidade (`bg-white/10`, `backdrop-blur`).

## 6. Componentes e UI

### Botões
- **Forma**: `rounded-xl` (canto arredondado médio-grande).
- **Primário**: `bg-teal-500 text-white font-bold hover:bg-teal-600 shadow-lg`.
- **Secundário**: `bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]`.
- **Ação Perigosa**: `bg-red-500/10 text-red-400 hover:bg-red-500/20`.
- **Interação**: `active:scale-95` (efeito de clique).

### Cards
- **Background**: `bg-[#0f1216]` ou `bg-white/[0.02]`.
- **Borda**: `border border-white/[0.05]`.
- **Border Radius**: `rounded-2xl` ou `rounded-3xl` para containers maiores.

### Inputs e Formulários
- **Background**: `bg-white/[0.05]`.
- **Borda**: `border-white/[0.1]`.
- **Focus**: `focus:ring-2 focus:ring-teal-500/50`.
- **Texto**: `text-white`.
- **Placeholder**: `placeholder-gray-500`.
- **Raio**: `rounded-xl`.

### Modal
- **Overlay**: Backdrop escuro com blur.
- **Container**: `bg-[#101922]` com borda sutil.
- **Animação**: `scale-up` ao abrir.

## 7. Responsividade

### Breakpoints (Tailwind Default)
- **sm**: 640px (Mobile Landscape / Tablets pequenos)
- **md**: 768px (Tablets / iPads)
- **lg**: 1024px (Laptops)
- **xl**: 1280px (Desktops)
- **2xl**: 1536px (Monitores Grandes)

### Adaptações Mobile
- **Navegação**: Menu inferior fixo (Bottom Navigation) em mobile, Sidebar ou Header em desktop.
- **Touch**: Áreas de toque aumentadas (`min-h-[44px]`).
- **Scroll**: Scrollbars ocultas (`::-webkit-scrollbar { display: none }`) para visual limpo.
- **Gestos**: Suporte a swipe em listas de transações.

## 8. Organização de Código (CSS)

- **Utility-First**: Evitar CSS puro sempre que possível. Usar classes utilitárias do Tailwind.
- **Consistência**: Usar variáveis de tema (`bg-background-dark`) em vez de valores hardcoded (`bg-[#101922]`) onde possível.
- **CSS Global (`index.css`)**: Reservado para resets, fontes, e estilos que não podem ser resolvidos via Tailwind (ex: customização de scrollbar, inputs nativos).

---
*Documentação gerada automaticamente com base na análise do código em 05/01/2026.*
