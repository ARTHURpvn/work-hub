# Design System — workhub

> Documentação **as-built** do design atual do frontend (port do design "claude design").
> Descreve a paleta, temas, tipografia, tokens, responsividade e acessibilidade
> **como implementados** em `frontend/src/index.css` e nos primitivos de UI.

---

## 1. Visão geral

O workhub usa uma linguagem visual **escura por padrão, com tema claro alternável**,
acento **laranja**, fonte **Open Sans** e neutros quentes (tons terrosos). A estética é
"ferramenta de dev minimalista" (Linear/Vercel), com cor usada só onde há significado.

- **Acento:** laranja (`#c96442` no claro, `#e08a64` no escuro).
- **Temas:** claro + escuro, com toggle na topbar; padrão **escuro**.
- **Fonte:** Open Sans (variável, self-hosted).
- **Implementação:** **CSS puro por classes** (`.btn`, `.card`, `.chip`, `.pill`, `.tag`…)
  dirigido por **CSS custom properties**. Tailwind v4 está importado para utilitários
  pontuais, mas o visual vem das variáveis + classes do design system — **não** de tokens shadcn.

---

## 2. Arquitetura de tema

- Todas as cores/raios/sombras são **CSS custom properties** definidas em `:root` (tema claro)
  e sobrescritas em `body.dark` (tema escuro).
- A troca de tema é uma **classe `dark` no `<body>`**, controlada por `store/themeStore.ts`
  (persistido em `localStorage`, chave `workhub.theme`) e aplicada no boot via `initTheme()`
  em `main.tsx`. Toggle (sol/lua) fica na topbar.
- `color-scheme` acompanha o tema (`light`/`dark`) para inputs nativos e scrollbars.

```
:root        → tema claro (valores-base)
body.dark    → tema escuro (sobrescreve as mesmas variáveis)
```

---

## 3. Tipografia

- **Fonte:** **Open Sans** (variável, pesos 300–800), self-hosted em
  `frontend/public/fonts/OpenSans-VariableFont_wdth_wght.ttf`, declarada via `@font-face`.
  Fallback: `system-ui, -apple-system, sans-serif` (variável `--ui`).
- **Base:** 15px, entrelinha 1.5; antialiasing ligado.
- **Escala (classes utilitárias do design system):**

| Classe | Tamanho / peso | Uso |
|---|---|---|
| `.t-display` | 26px / 800 | título de página (`h1`) |
| `.t-h2` | 19px / 700 | título de seção/card |
| `.t-h3` | 15px / 700 | subtítulo |
| corpo | 15px / 400 | texto padrão |
| `.t-meta` | 12px | metadados, legendas (muted) |
| `.t-label` | 11px / 700 / uppercase / tracking | rótulos de campo/seção |
| `.mono` | tabular-nums | números (KPIs, datas, %) |

---

## 4. Tokens de cor

Valores **exatos** de `index.css`. Hex direto (não HSL).

### Tema claro (`:root`)

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#f4f1ea` | fundo da app |
| `--bg-2` | `#efebe1` | sidebar, inputs, rodapés de modal |
| `--surface` | `#fbfaf6` | cards, topbar |
| `--surface-2` | `#f3efe6` | hover de superfície |
| `--surface-3` | `#ece6d9` | trilhos/realces |
| `--text` | `#2a2620` | texto principal |
| `--text-2` | `#5f594f` | texto secundário |
| `--muted` | `#8a8276` | texto terciário/legendas |
| `--border` / `--border-2` | `#e3dccd` / `#d4cab8` | bordas |
| `--accent` | `#c96442` | **botões/links/ativo/foco** |
| `--accent-press` | `#b4543a` | acento pressionado/hover |
| `--accent-weak` | `#f1e2da` | realce sutil (item ativo, badges) |
| `--accent-text` | `#fff` | texto sobre o acento |
| `--ring` | `rgba(201,100,66,.28)` | anel de foco |

### Tema escuro (`body.dark`)

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#1a1714` | fundo |
| `--bg-2` | `#161310` | sidebar/inputs |
| `--surface` | `#242019` | cards/topbar |
| `--surface-2` | `#2c271f` | hover |
| `--surface-3` | `#353029` | trilhos |
| `--text` | `#efe9df` | texto principal |
| `--text-2` | `#c1b8aa` | secundário |
| `--muted` | `#948b7c` | terciário |
| `--border` / `--border-2` | `#383128` / `#463e33` | bordas |
| `--accent` | `#e08a64` | acento (mais claro p/ contraste) |
| `--accent-press` | `#ec9b78` | hover |
| `--accent-weak` | `#3a2b22` | realce sutil |
| `--accent-text` | `#1a1714` | texto sobre o acento |

### Cores semânticas (claro / escuro)

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--ok` / `--ok-weak` | `#3f8f55` / `#e2efe4` | `#5fb074` / `#233127` | sucesso, "Concluído", online |
| `--warn` / `--warn-weak` | `#c2871f` / `#f4e9d2` | `#d6a445` / `#362d1a` | atenção, "Em Revisão" |
| `--danger` / `--danger-weak` | `#cf5a3c` / `#f6e1da` | `#e0795a` / `#3a2620` | erro, vencida, destrutivo |
| `--info` / `--info-weak` | `#4a72c4` / `#e2e9f5` | `#7a9be0` / `#20283a` | informação, "Em Andamento" |

### Cores de origem (dono do projeto)

| Origem | Token | Classe | Cor (claro/escuro) |
|---|---|---|---|
| Otavio | `--o-otavio` | `.tag-otavio` | `#c96442` / `#e08a64` (laranja) |
| Titan | `--o-titan` | `.tag-titan` | `#8a4fd8` / `#b08ce8` (roxo) |
| Freelas | `--o-free` | `.tag-free` | `#c2871f` / `#d6a445` (âmbar) |
| Pessoal | `--o-pess` | `.tag-pess` | `#3f8f55` / `#5fb074` (verde) |

Mapeamento origem→meta e status→meta vive em `frontend/src/lib/domain.ts`.

---

## 5. Status de tarefa (pills)

| Status (API) | Classe | Cor |
|---|---|---|
| A Fazer | `.pill-todo` | muted/neutro |
| Em Andamento | `.pill-doing` | info (azul) |
| Em Revisão | `.pill-review` | warn (âmbar) |
| Concluído | `.pill-done` | ok (verde) |
| (vencida) | `.pill-late` | danger (vermelho) + ícone alerta |

Status nunca é só cor — sempre **cor + rótulo/ícone** (componente `StatusPill`).

---

## 6. Raio, sombra, espaçamento

- **Raio:** `--r-sm 7px` · `--r-md 10px` · `--r-lg 14px` · `--r-xl 20px` (modais/login).
- **Sombra:** `--shadow-sm/md/lg` — sutil no claro, mais densa no escuro.
- **Espaçamento:** grade base de ~4/8px; `.page` com padding 26px (desktop) → 16–18px (mobile);
  gaps de grid 14–18px.
- **Sidebar:** largura `--side-w: 232px`.

---

## 7. Responsividade

Mobile-first não é o padrão do CSS (escrito desktop-first com `max-width`), mas todas as
telas respondem. Breakpoints implementados em `index.css`:

| Breakpoint | O que muda |
|---|---|
| `≤1000px` | KPIs 4→2 colunas; `.split` vira 1 coluna; grids `g-3` 3→2; **Kanban** vira scroll horizontal com snap |
| `≤900px` | **Tela de skill** (`SkillDetail`) empilha chat + conteúdo em 1 coluna |
| `≤760px` | **Sidebar vira drawer off-canvas** (`body.nav-open` + scrim); topbar mostra o botão ☰; modais colam no rodapé; calendário compacta eventos |

Alvos de toque confortáveis (botões ~36–40px, ícones 18px) e sem overflow horizontal.

---

## 8. Acessibilidade

- **Cor + rótulo/ícone** em todo status (pills, tags, toasts).
- **Foco visível:** `box-shadow: 0 0 0 3px var(--ring)` em inputs/textarea; acento em itens ativos.
- **Esc** fecha modais e drawers; clique no overlay também fecha.
- **Inputs** com `Label` (componente `Field`) e mensagens de erro em texto + cor.
- **Estados por tela:** Carregando · Vazio (com ação, `EmptyState`) · Dados · Erro.
- Contraste mirando WCAG AA tanto no claro quanto no escuro (acento mais claro no dark).

---

## 9. Onde está no código

| Item | Arquivo |
|---|---|
| Tokens, temas, classes de componente | `frontend/src/index.css` |
| Fonte Open Sans | `frontend/public/fonts/` + `@font-face` no `index.css` |
| Tema (claro/escuro + persistência) | `frontend/src/store/themeStore.ts`, init em `main.tsx` |
| Origem/Status/datas/progresso | `frontend/src/lib/domain.ts` |
| Ícones (SVG por path) | `frontend/src/components/ui/Icon.tsx` |
| Primitivos (Button, Field, inputs, Check, Progress, OriginTag, StatusPill, Empty) | `frontend/src/components/ui/kit.tsx` |
| Modal / Drawer | `frontend/src/components/ui/{Modal,Drawer}.tsx` |
| Toast / Confirm | `frontend/src/components/ui/{toaster,confirm-dialog}.tsx` |

Ver o layout, o app shell e o catálogo de componentes em
[`DESIGN_LAYOUT_COMPONENTS.md`](./DESIGN_LAYOUT_COMPONENTS.md).

---

## 10. Histórico

O design atual é um **port fiel do design "claude design"** (paleta laranja, claro+escuro,
Open Sans, CSS por classes), substituindo a iteração anterior (paleta Blue, dark-only, Inter,
componentes shadcn). As decisões originais de cor/tipografia foram superadas por esta versão
implementada — este documento reflete o estado atual do código.
