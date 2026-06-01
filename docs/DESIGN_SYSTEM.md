# Design System — workhub

> Documento de UI/UX: diagnóstico, direção visual, paleta de cores, tipografia,
> responsividade, acessibilidade e plano de implementação. **Nada de código foi
> alterado ainda** — este é o brief para aprovação antes da implementação.

---

## 1. Diagnóstico do estado atual

O que existe hoje (`frontend/src/index.css`):

- Tema **HSL neutro quase puro**: `--primary: 240 5.9% 10%` (preto-azulado), fundo branco,
  bordas e textos em escala de cinza. **Zero cor de marca.**
- Único respiro de cor: os badges de origem (`Otavio`=azul, `Titan`=roxo, `Freelas`=verde)
  no `ProjetoCard` — mas isoladamente.
- Sem hierarquia visual forte: tudo tem o mesmo peso de cor → a tela "achata".
- Dark mode definido, mas com cinza neutro (sem matiz, sem elevação por camadas).

**Conclusão:** o problema não é "feio", é **monocromático e sem foco**. Falta uma cor
primária que guie o olho (CTAs, links, estado ativo), neutros com leve temperatura e
cores semânticas (sucesso/alerta/erro/info). Resolvendo isso + tipografia e densidade,
o salto visual é grande sem reescrever componentes.

---

## 2. Princípios (o que vamos seguir)

1. **Regra 60-30-10** — 60% neutro (fundos/superfícies), 30% secundária (sidebar, cards,
   blocos), 10% **cor de destaque** (botões primários, links, ativo, foco). É o que falta hoje.
2. **Restraint / confiança antes de densidade** (padrão Stripe/Linear) — a tela responde primeiro
   "está tudo certo?" com 5–9 elementos-chave, cor só onde há ação.
3. **Cor com significado** — verde = sucesso, vermelho = falha/perigo, âmbar = atenção, azul = info.
   Nunca cor decorativa competindo com cor funcional.
4. **Acessível por padrão** — contraste WCAG AA (4.5:1 texto, 3:1 UI/ícones), foco visível, 44px de toque.
5. **Mobile-first** — desenhar 320px primeiro, progredir com `min-width`.
6. **Tokens semânticos** — componentes usam `bg-primary`, `text-muted-foreground`… então mudar o
   tema é trocar variáveis, sem tocar componente.

---

## 3. Direção visual — 3 opções de paleta

Todas compartilham **neutros "slate"** (cinza com leve matiz azul — mais sofisticado que o cinza
puro atual) e as **cores semânticas**. Muda só a **cor primária + destaque**.

| Opção | Primária | Destaque | Vibe | Referência |
|---|---|---|---|---|
| **A — Indigo/Violet** ⭐ *(recomendada)* | Indigo `#4F46E5` | Violet `#8B5CF6` | Tech, moderno, "dev tool" | Linear, Vercel |
| B — Blue corporativo | Blue `#2563EB` | Sky `#0EA5E9` | Confiável, sóbrio | Stripe |
| C — Teal/Esmeralda | Teal `#0D9488` | Emerald `#10B981` | Fresco, diferenciado | Produtividade |

**Por que a A:** o workhub é uma ferramenta de trabalho/dev (Kanban, projetos, agentes Claude, VPS).
Indigo/Violet comunica "produto técnico moderno", combina com o roxo que você já usa no badge `Titan`,
e tem ótimo contraste tanto no claro quanto no escuro.

👉 **Para visualizar antes de decidir:** cole os hexes em
[Realtime Colors](https://realtimecolors.com/) (vê a paleta aplicada num layout real) ou
[Coolors](https://coolors.co/) (gera/ajusta e checa acessibilidade).

---

## 4. Tokens de cor (opção A) — prontos para o `index.css`

Mantive o formato **HSL** já usado no projeto (`hsl(var(--token))`). Hex ao lado só para leitura.
(Evolução futura possível: migrar para **OKLCH**, que é o padrão novo do shadcn/Tailwind v4 — ver §12.)

### Light (`:root`)

| Token | HSL | Hex | Uso |
|---|---|---|---|
| `--background` | `0 0% 100%` | `#FFFFFF` | fundo da app |
| `--foreground` | `222 47% 11%` | `#0F172A` | texto principal (slate-900) |
| `--card` | `0 0% 100%` | `#FFFFFF` | cards |
| `--muted` | `210 40% 96%` | `#F1F5F9` | superfície sutil (slate-100) |
| `--muted-foreground` | `215 16% 47%` | `#64748B` | texto secundário (slate-500) |
| `--border` | `214 32% 91%` | `#E2E8F0` | bordas (slate-200) |
| `--input` | `214 32% 91%` | `#E2E8F0` | bordas de input |
| `--primary` | `243 75% 59%` | `#4F46E5` | **botões/links/ativo (indigo-600)** |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | texto sobre primária |
| `--accent` | `250 95% 92%` | `#E9E5FF` | hover/realce sutil (violet-100) |
| `--accent-foreground` | `243 75% 40%` | `#3730A3` | texto sobre accent |
| `--ring` | `243 75% 59%` | `#4F46E5` | anel de foco |
| `--success` | `160 84% 39%` | `#10B981` | sucesso (emerald-500) |
| `--warning` | `38 92% 50%` | `#F59E0B` | atenção (amber-500) |
| `--destructive` | `0 84% 60%` | `#EF4444` | erro/perigo (red-500) |
| `--info` | `217 91% 60%` | `#3B82F6` | informação (blue-500) |

### Dark (`.dark`) — sem preto puro, com elevação por camadas

| Token | HSL | Hex | Uso |
|---|---|---|---|
| `--background` | `222 47% 7%` | `#0B1120` | fundo (slate-950-ish, **não** #000) |
| `--foreground` | `210 40% 96%` | `#F1F5F9` | texto (slate-100) |
| `--card` | `222 44% 11%` | `#111827` | superfície +1 (elevação) |
| `--muted` | `217 33% 17%` | `#1E293B` | superfície sutil (slate-800) |
| `--muted-foreground` | `215 20% 65%` | `#94A3B8` | texto secundário (slate-400) |
| `--border` | `217 33% 20%` | `#293548` | bordas |
| `--primary` | `239 84% 67%` | `#6366F1` | indigo-500 (mais claro p/ contraste) |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | texto sobre primária |
| `--accent` | `243 47% 20%` | `#272252` | hover/realce |
| `--ring` | `239 84% 67%` | `#6366F1` | foco |
| `--success` | `158 64% 52%` | `#34D399` | emerald-400 |
| `--warning` | `38 92% 60%` | `#FBBF24` | amber-400 |
| `--destructive` | `0 72% 58%` | `#F05252` | red-400/500 |
| `--info` | `213 94% 68%` | `#60A5FA` | blue-400 |

**Elevação no dark** (em vez de sombra): cada camada que "sobe" fica ~3-5% mais clara —
fundo `#0B1120` → card `#111827` → modal/sheet `#1E293B`. (Fonte: práticas de dark mode, §13.)

### Cores de origem (mantidas, alinhadas à paleta)
`Otavio` → azul (`info`), `Titan` → violet (combina com a primária), `Freelas` → emerald (`success`).

> Os tokens `--success/--warning/--info` são **novos** — adicioná-los exige também expô-los em
> `@theme inline` (ex.: `--color-success: hsl(var(--success))`) para virar classe `bg-success`.

---

## 5. Aplicação da cor (60-30-10 por tela)

- **60% neutro:** fundo da app, texto, a maioria das superfícies.
- **30% secundário:** sidebar, cards, cabeçalhos de coluna do Kanban, blocos de detalhe.
- **10% destaque (indigo):** botão "Novo", item de menu ativo, links, foco, aba selecionada,
  número-chave do dashboard.

| Tela | Onde entra a cor |
|---|---|
| **Dashboard** | número principal de cada card em indigo; **vencidas** em vermelho, **próximas** em âmbar; barras/realces das origens nas suas cores |
| **Projetos** | badge de origem colorido (já existe); ícone de credencial/VPS em neutro; botão "Novo projeto" indigo; chips de filtro ativos em indigo |
| **VPS** | ícone `Server` em indigo quando há projetos; contagem destacada |
| **Tarefas/Kanban** | **prioridade** com cor (baixa=slate, média=âmbar, alta=vermelho); colunas com faixa de cor no topo; prazo vencido em vermelho |
| **Login** | botão primário indigo; foco visível |

---

## 6. Tipografia

- **Fonte:** **Inter** (UI padrão da indústria; já temos `system-ui` como fallback). Carregar via
  `@fontsource/inter` ou Google Fonts. Pareamento: Inter 400 (corpo) / 600–700 (títulos).
- **Escala modular 1.25 (Major Third)**, base 16px, em `rem`:

| Token | Tamanho | Uso |
|---|---|---|
| `text-xs` | 12px | legendas, metadados |
| `text-sm` | 14px | corpo de UI (densidade de dashboard) |
| `text-base` | 16px | corpo |
| `text-lg` | 20px | subtítulos |
| `text-xl` | 25px | títulos de seção |
| `text-2xl` | 31px | título de página |

- **Entrelinha:** corpo 1.5–1.7; títulos 1.1–1.25.
- **Peso/hierarquia:** diferencie por **peso e cor** (foreground vs muted-foreground), não só tamanho.

---

## 7. Espaçamento, raio e sombra

- **Grade de 8px** (4px para ajustes finos). Tailwind já é múltiplo de 4.
- **Raio:** `--radius: 0.5rem` (atual). Sugiro `0.625rem` (10px) p/ um ar mais moderno; cards 12px.
- **Sombra (light):** sutil e em camadas — `shadow-sm` em cards, `shadow-md` em popover/sheet.
- **Sombra (dark):** trocar por **elevação de cor** (§4) — sombra some no escuro.

---

## 8. Responsividade (100%, mobile-first)

**Breakpoints (Tailwind, mobile-first com `min-width`):**

| Prefixo | Largura | Alvo |
|---|---|---|
| (base) | 0–639px | celular |
| `sm` | ≥640px | celular grande/landscape |
| `md` | ≥768px | tablet |
| `lg` | ≥1024px | desktop |
| `xl` | ≥1280px | desktop grande |

**Regras por layout:**

- **Sidebar:** já é `hidden md:flex` (drawer no mobile via topbar). **Falta** implementar o drawer
  de fato (hoje o `toggleSidebar` existe mas não abre overlay no mobile) → item do plano.
- **Grids de cards:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (Projetos/VPS já seguem).
- **Kanban:** rolagem horizontal no mobile (`overflow-x-auto`), colunas com largura mínima.
- **Dashboard:** cards `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- **Sheets/formulários:** `w-full max-w-md` — no mobile ocupam a tela inteira.
- **Tabelas/listas densas:** viram cards empilhados < `md`.

**Checklist 320px (obrigatório):** nada de overflow horizontal; toque mínimo **44×44px**;
fontes legíveis (≥14px em UI); botões e inputs full-width quando fizer sentido.

---

## 9. Acessibilidade (WCAG 2.2 AA)

- **Contraste:** texto normal **4.5:1**, texto grande/ícones/bordas de componente **3:1**.
  Validar cada par no [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).
- **Cor nunca sozinha:** status sempre cor **+** ícone/texto (ex.: vencido = vermelho + ícone alerta).
- **Foco visível:** anel `--ring` em todo elemento focável (já há `focus-visible:ring`).
- **Teclado:** toda ação alcançável por Tab/Enter/Esc (o `DetailSheet`/`Sheet` já fecha no Esc).
- **Labels:** associados aos inputs; erros em texto + cor, ligados ao campo.
- **Estados obrigatórios em toda tela:** Carregando (skeleton) · Vazio (com ação) · Dados · Erro (humano + recuperação) — boa parte já existe; padronizar.

---

## 10. Componentes — ajustes e novos

**Ajustar (só estilo/tokens, sem mudar lógica):**
- `Badge` — adicionar variantes `success/warning/info` usando os tokens novos.
- `Button` — variante `primary` com indigo + `hover` (primary mais escura), foco visível.
- `Sidebar` — item ativo com fundo `accent` + barra/realce indigo; implementar **drawer mobile**.
- `ProjetoCard`/cards — hover mais perceptível, badge de origem colorido, leve sombra.
- `Dashboard` — números-chave grandes e coloridos; cores semânticas em vencidas/próximas.

**Criar:**
- Tokens `success/warning/info` (CSS vars + `@theme inline`).
- `StatCard` consistente (já há um inline no Dashboard → extrair p/ `components/ui`).
- `EmptyState` reutilizável (ícone + texto + ação) — padroniza o estado vazio.

---

## 11. Plano de implementação (quando você aprovar)

1. **Fundação de tokens** — reescrever `index.css` com a paleta (light+dark) + `@theme inline`;
   instalar Inter. *(1 arquivo, base de tudo.)*
2. **Primitivos** — `Button`, `Badge`, `Input`, foco/anel, raio. 
3. **Navegação** — Sidebar (ativo colorido + drawer mobile) e topbar.
4. **Dashboard** — hierarquia de números, cores semânticas, StatCard.
5. **Telas** — Projetos, VPS, Tarefas, Kanban, Login com a nova linguagem.
6. **Passo de QA visual** — checklist 320px, contraste, estados, dark mode.

Cada etapa é incremental e não quebra a funcionalidade (só troca tokens/classes).

---

## 12. Conceitos aplicados (resumo do "porquê")

- **Escala de cor com 12 passos por hue** (fundos→bordas→texto) em vez de "clarear/escurecer" na
  hora — base do Radix Colors e do Refactoring UI.
- **Neutro com temperatura** (slate) no lugar de cinza puro → menos "morto".
- **60-30-10** para dar foco e reduzir carga cognitiva.
- **Dark mode por elevação de cor**, sem preto puro (evita halation e permite profundidade).
- **Tokens semânticos + OKLCH** como caminho de evolução (gamut maior, melhor no dark).

---

## 13. Referências e inspiração (links)

**Sistemas de cor / como construir paleta**
- [Radix Colors](https://www.radix-ui.com/colors) · [escala de 12 passos](https://www.radix-ui.com/colors/docs/palette-composition/scales) · [casos de uso](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)
- [Refactoring UI — Building Your Color Palette](https://refactoringui.com/previews/building-your-color-palette/)
- [shadcn/ui — Theming](https://ui.shadcn.com/docs/theming) · [Tailwind v4 + OKLCH](https://ui.shadcn.com/docs/tailwind-v4) · [paleta de cores](https://ui.shadcn.com/colors)
- [tweakcn — editor de temas shadcn](https://tweakcn.com/)

**Teoria de cor aplicada**
- [60-30-10 (UX Planet)](https://uxplanet.org/the-60-30-10-rule-a-foolproof-way-to-choose-colors-for-your-ui-design-d15625e56d25) · [60-30-10 (LogRocket)](https://blog.logrocket.com/ux-design/60-30-10-rule/)
- [Tubik — 6 dicas de cor em UI](https://blog.tubikstudio.com/color-matters-6-tips-on-choosing-ui-colors/)

**Ferramentas para gerar/visualizar paleta**
- [Realtime Colors](https://realtimecolors.com/) (paleta aplicada num layout real)
- [Coolors](https://coolors.co/) · [Huemint (IA)](https://huemint.com/) · [Colormind (IA)](https://colormind.io/)

**Inspiração de dashboards / produtos**
- [35 SaaS dashboards de referência (2026)](https://www.925studios.co/blog/saas-dashboard-design-examples-2026)
- [Guia "estética Vercel" (grid + minimalismo)](https://www.setproduct.com/blog/complete-guide-to-blueprint-grid-design)
- [Tendências de UI SaaS 2026](https://www.saasui.design/blog/7-saas-ui-design-trends-2026)
- [Templates SaaS — Vercel](https://vercel.com/templates/saas)

**Tipografia**
- [Modular type scale para UI](https://blog.prototypr.io/defining-a-modular-type-scale-for-web-ui-51acd5df31aa) · [Design Systems — Typography](https://www.designsystems.com/typography-guides/)
- [Utopia — escala tipográfica fluida/responsiva](https://utopia.fyi/)

**Responsividade**
- [MDN — Responsive Design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design)
- [Breakpoints 2025 (BrowserStack)](https://www.browserstack.com/guide/responsive-design-breakpoints)

**Dark mode**
- [LogRocket — dark mode best practices](https://blog.logrocket.com/ux-design/dark-mode-ui-design-best-practices-and-examples/)
- [Uxcel — 12 princípios de dark mode](https://uxcel.com/blog/12-principles-of-dark-mode-design-627)

**Acessibilidade**
- [WebAIM — Contrast & Color](https://webaim.org/articles/contrast/) · [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contraste WCAG 2.2 AA](https://www.makethingsaccessible.com/guides/contrast-requirements-for-wcag-2-2-level-aa/)

---

## 14. Design Brief (entregável da persona) — para aprovação

```
Design Brief — Reestilização visual do workhub
Fluxo      : tokens de cor → primitivos → navegação → dashboard → telas → QA visual
Estados    : Carregando | Vazio | Dados | Erro (padronizados em todas as telas)
Componentes: Reutilizar Sheet/DetailSheet, Card, Badge, Button, Skeleton
             Criar  StatCard, EmptyState, tokens success/warning/info, drawer mobile
Cor        : Opção A (Indigo #4F46E5 + Violet) · neutros slate · semânticas
Riscos UX  : drawer mobile inexistente hoje; garantir contraste do indigo no dark (usar indigo-500)
Responsivo : mobile-first, validado em 320px / 768px / 1024px
Aprovado   : ( ) Sim   ( ) Não   — escolher opção de paleta: ( )A  ( )B  ( )C
```

**Decisões que preciso de você:**
1. **Paleta:** A (Indigo ⭐), B (Blue) ou C (Teal)?
2. **Dark mode:** manter alternável claro/escuro, ou focar em um só por enquanto?
3. **Inter:** pode adicionar a fonte (pequeno peso no bundle) ou prefere manter `system-ui`?
