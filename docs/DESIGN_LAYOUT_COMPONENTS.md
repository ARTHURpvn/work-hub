# Layout & Componentes — workhub

> Complemento do [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (cor/tipografia/tokens).
> Aqui está a **estrutura de layout** (app shell, grids, telas) e o **sistema de
> componentes** (hierarquia, catálogo, anatomia, variantes e estados).
> **Ainda é planejamento** — nenhum código foi alterado.

---

## 1. Arquitetura de UI — Atomic Design adaptado

Organização em 5 níveis (Brad Frost), mapeada aos arquivos do projeto:

| Nível | O que é | No projeto |
|---|---|---|
| **Tokens** | cor, tipografia, espaço, raio | `index.css` (`@theme`) |
| **Átomos** | building blocks indivisíveis | `ui/`: `Button`, `Badge`, `Input`, `Label`, `Skeleton` |
| **Moléculas** | grupos pequenos com função | `DetailField`, `NavItem`, `StatCard`, `EmptyState`, `FilterChip` |
| **Organismos** | blocos complexos | `Sidebar`, `ProjetoCard`, `CredencialBox`, `KanbanColumn`, `MembrosList` |
| **Templates** | esqueleto de página (sem dado) | `AppLayout`, `PageTemplate`, `DetailSheet` |
| **Páginas** | template + dados reais | `Dashboard`, `Projetos`, `Vps`, `Tarefas`, `Kanban`, `Login` |

Regra prática: **átomo nunca busca dado**; organismos/páginas orquestram. Componentes de `ui/`
são "burros" e reutilizáveis; os de feature compõem.

---

## 2. Estrutura de pastas (recomendada)

Alinhada ao padrão do projeto. O que está **em negrito** é ajuste sugerido:

```
frontend/src/
├── components/
│   ├── ui/            # átomos/primitivos (shadcn-like, sem regra de negócio)
│   │   ├── button, badge, input, label, skeleton, sheet   (existem)
│   │   ├── textarea, select, checkbox, switch             (CRIAR)
│   │   ├── dialog, dropdown-menu, tooltip, toast          (CRIAR)
│   │   ├── stat-card, empty-state, separator, avatar      (CRIAR)
│   ├── common/        # moléculas/templates compartilhados
│   │   ├── DetailSheet (existe), **PageHeader**, **FilterBar**, **ConfirmDialog**
│   ├── layout/        # AppLayout, Sidebar, **Topbar**, **MobileDrawer**
│   └── features/      # organismos por domínio
│       ├── projetos/  tarefas/  vps/  kanban/   (já organizados assim)
├── hooks/  api/  store/  pages/  lib/
```

> Hoje os componentes de feature estão em `components/projetos`, `components/tarefas`, etc.
> Mantemos — só formalizamos o `ui/` (primitivos) vs `features/` (organismos).

---

## 3. App Shell (layout global)

Padrão de SaaS: **sidebar fixa + topbar + área de conteúdo**. Sidebar de **256px** (16rem),
**64px** colapsada, **drawer** no mobile (overlay).

### Desktop (≥768px)
```
┌──────────┬───────────────────────────────────────────────┐
│ SIDEBAR  │  TOPBAR  (título da página · busca · ações · ⚙) │ 56px
│ 256px    ├───────────────────────────────────────────────┤
│          │                                                 │
│ logo     │   CONTEÚDO                                      │
│ ─────    │   ┌─ PageHeader (h1 + ação primária) ─────────┐ │
│ ▸ Dash   │   ├─ FilterBar (filtros/abas/ordenação) ──────┤ │
│ ▸ Proj   │   ├─ Conteúdo (grid de cards / board / form)  │ │
│ ▸ Taref  │   │   estados: loading · vazio · dados · erro  │ │
│ ▸ Kanban │   └────────────────────────────────────────────┘ │
│ ▸ VPS    │                                                 │
│ ─────    │                                                 │
│ ⚙ Config │                                                 │
└──────────┴───────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌───────────────────────────────┐
│ ☰  workhub            ⚙        │ topbar (44px+) — botão ☰ abre drawer
├───────────────────────────────┤
│  PageHeader (h1)               │
│  [ + Ação primária ] full-w    │
│  FilterBar (scroll horizontal) │
│  Card                          │
│  Card                          │  conteúdo empilhado, 1 coluna
│  Card                          │
└───────────────────────────────┘
   Drawer (off-canvas) cobre a tela com overlay ao tocar ☰
```

### Camadas (z-index) — padronizar
| Camada | z-index |
|---|---|
| conteúdo base | 0 |
| sidebar fixa | 30 |
| overlay (drawer/sheet) | 40 |
| sheet/drawer/dialog | 50 |
| toast | 60 |

**Lacuna atual:** o `toggleSidebar` do `uiStore` existe mas **não há drawer mobile** — a sidebar
só some (`hidden md:flex`). Item do plano: criar `MobileDrawer` reaproveitando o `Sidebar`.

---

## 4. Template de página padrão

Toda página de lista segue a mesma anatomia → consistência e menos código:

```
<PageTemplate>
  <PageHeader title="Projetos" action={<Button>+ Novo</Button>} />
  <FilterBar> …chips/select/ordenação… </FilterBar>
  <PageContent
    isLoading → <SkeletonGrid />
    isError   → <ErrorState onRetry />
    empty     → <EmptyState action />
    data      → <CardGrid /> | <KanbanBoard /> | <List />
  />
</PageTemplate>
```

- **`PageHeader`** (CRIAR): `h1` + slot de ação à direita; vira coluna no mobile.
- **`FilterBar`** (CRIAR): wrapper com `flex-wrap`, scroll-x no mobile; agrupa `FilterChip` e selects.
- **`EmptyState`** (CRIAR): ícone + título + descrição + ação. Nunca "Sem dados".

Hoje Dashboard/Projetos/Tarefas/VPS repetem esse esqueleto inline — extrair padroniza tudo.

---

## 5. Layout por tela

### Dashboard (grid de métricas + repos por VPS)
```
PageHeader: "Dashboard"
┌ StatCard ┐┌ StatCard ┐┌ StatCard ┐┌ StatCard ┐   grid 1 / sm:2 / lg:4
│ Projetos ││ Tarefas  ││ Agentes  ││  Jobs    │
└──────────┘└──────────┘└──────────┘└──────────┘
Seção "Repositórios por VPS"   grid 1 / lg:2
┌ VPS card (projetos + links) ┐┌ Sem VPS ┐
```
- StatCard: rótulo + **número grande colorido** + sub-linha + chips. Hierarquia por tamanho/peso/cor.

### Projetos / VPS (grid de cards + Sheet de detalhe)
```
PageHeader + FilterBar(chips origem · arquivados)
CardGrid (1 / sm:2 / lg:3)  →  clique abre DetailSheet (ver → editar)
```

### Tarefas (lista) e Kanban (board)
```
Tarefas: PageHeader + FilterBar(status·projeto·prazo·ordenação) + Lista de TarefaCard
Kanban : 4 colunas (A Fazer · Em Andamento · Em Revisão · Concluído)
         scroll-x no mobile; topo de cada coluna com faixa de cor + contador
```

### Detalhe (Sheet ver→editar) — padrão já criado
```
DetailSheet
 ├ modo "view": DetailField… + botão Editar (topo direito)
 └ modo "edit": <Form> + Salvar/Cancelar (+ ações destrutivas no fim)
```

### Login (centralizado)
```
Card centralizado (max-w-sm) · logo · campos · botão primário full-width
```

---

## 6. Catálogo de componentes

### 6.1 Inventário

| Componente | Estado | Observação |
|---|---|---|
| Button, Badge, Input, Label, Skeleton, Sheet | ✅ existe | revisar variantes/estados/tokens |
| DetailSheet + DetailField | ✅ existe | base do ver→editar |
| ProjetoCard/Form/View/Sheet, CredencialBox, MembrosList | ✅ existe | organismos de feature |
| TarefaCard/Form/View/Sheet, Kanban* | ✅ existe | — |
| Vps Form/View/Sheet | ✅ existe | card está inline em `pages/Vps` → extrair `VpsCard` |
| **Textarea, Select, Checkbox, Switch** | ❌ criar | hoje usam `<select>`/`<input>` nativos soltos |
| **Dialog / ConfirmDialog** | ❌ criar | hoje usa `confirm()` nativo (CredencialBox/VpsForm) |
| **Toast / feedback** | ❌ criar | sem feedback de sucesso após salvar |
| **Tooltip, DropdownMenu, Avatar, Separator, Tabs** | ❌ criar | conforme necessidade |
| **StatCard, EmptyState, PageHeader, FilterBar** | ❌ criar | padrões compostos (§4) |

### 6.2 Fichas (anatomia · variantes · estados · a11y)

Formato baseado em boas práticas de documentação de design system (nome → exemplo → anatomia →
variantes → estados → props → a11y).

#### Button (átomo)
- **Variantes:** `primary` (indigo), `secondary` (slate), `outline`, `ghost`, `destructive`, `link`.
- **Tamanhos:** `sm` (32px), `md` (40px), `lg` (44px — toque). Ícone-only: quadrado, `aria-label`.
- **Estados:** default · hover (primária mais escura) · active · **focus-visible (ring)** · disabled (opacidade + sem ponteiro) · **loading** (spinner + texto, desabilitado).
- **A11y:** contraste 4.5:1 no texto; alvo ≥44px nas ações principais; foco sempre visível.

#### Badge (átomo)
- **Variantes (CRIAR semânticas):** `neutral`, `primary`, `success`, `warning`, `danger`, `info`, + origens (`Otavio`/`Titan`/`Freelas`).
- **Uso:** status, origem, contadores. Sempre **cor + rótulo** (nunca só cor).

#### Input / Textarea / Select (átomos)
- **Anatomia:** `Label` (visível) → campo → texto de ajuda → mensagem de erro.
- **Estados:** default · focus (ring) · disabled · **error** (borda `destructive` + msg associada via `aria-describedby`).
- **Select:** padronizar visual (hoje `<select>` nativo varia entre telas).

#### Card / StatCard (molécula)
- **Card:** superfície + borda + raio + `shadow-sm`; hover sutil quando clicável.
- **StatCard:** rótulo (muted) · número grande (cor) · sub-linha · chips. Usado no Dashboard.

#### Sheet / DetailSheet (organismo/template)
- **Anatomia:** overlay + painel lateral (`max-w-md`, full-screen no mobile) + header (título + fechar) + corpo rolável.
- **DetailSheet:** alterna `view`/`edit`; botão **Editar** no topo em `view`.
- **Estados/A11y:** fecha no **Esc** e no clique do overlay; `role="dialog"` `aria-modal`; foco-trap (melhorar).

#### EmptyState (molécula) — CRIAR
- ícone + título + descrição curta + **ação primária**. Ex.: "Nenhuma VPS cadastrada → Cadastrar primeira VPS".

#### ConfirmDialog (organismo) — CRIAR
- Substitui `confirm()` nativo. Título + descrição + **Cancelar/Confirmar** (confirmar `destructive` quando apaga). Foco inicial no Cancelar.

#### Toast (organismo) — CRIAR
- Feedback de "salvo", "erro ao salvar", "excluído". Canto inferior; some sozinho; `aria-live="polite"`.

#### NavItem (molécula)
- Ícone + label; estados: default · hover · **ativo** (fundo `accent` + texto/realce indigo) · disabled.
- Colapsada: só ícone + `title`/tooltip. Alvo ≥44px.

---

## 7. Grid, densidade e ritmo

- **Grade de 8px**; gaps de cards `12–16px`; padding de página `16px` (mobile) → `24px` (desktop).
- **CSS Grid `auto-fill`/`minmax`** para card grids que respiram sozinhos:
  `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))`.
- **Densidade:** dashboard é para power users → preferir `text-sm` e espaçamento compacto, sem sufocar.
- **Largura de leitura:** blocos de texto/forms `max-w-md`/`max-w-2xl`; o board do Kanban usa largura total.

---

## 8. Interação e feedback (padrões)

- **Toda ação tem retorno:** loading no botão, toast no sucesso/erro, optimistic update onde fizer sentido (Kanban já reverte em erro).
- **Navegação:** sidebar persistente; item ativo destacado; (futuro) breadcrumb se surgirem telas aninhadas.
- **Formulários:** label sempre visível, validação no submit, erro junto ao campo, foco no 1º inválido.
- **Destrutivo:** sempre `ConfirmDialog`; texto deixa claro o impacto (ex.: "desvincula N projetos").

---

## 9. Plano de implementação (layout + componentes)

Encaixa nas etapas do `DESIGN_SYSTEM.md` §11:

1. **Primitivos `ui/`** — formalizar `Button/Badge/Input` (variantes/estados) + criar `Textarea`, `Select`, `Checkbox`.
2. **Padrões compostos** — `PageHeader`, `FilterBar`, `EmptyState`, `StatCard` (extrair do Dashboard).
3. **App shell** — `Topbar`, `MobileDrawer` (sidebar off-canvas), z-index padronizado.
4. **Feedback** — `Toast` + `ConfirmDialog` (substituir `confirm()` nativo).
5. **Refino por tela** — aplicar `PageTemplate` em Dashboard/Projetos/VPS/Tarefas/Kanban.
6. **QA visual** — 320px, foco-trap nos sheets, contraste, estados completos.

Tudo incremental: trocar `<select>` solto por `Select`, `confirm()` por `ConfirmDialog`, etc.,
sem mexer na lógica de dados.

---

## 10. Referências (links)

**Arquitetura de componentes**
- [Atomic Design — Brad Frost (cap. 2)](https://atomicdesign.bradfrost.com/chapter-2/)
- [Atomic Design para devs (composição/organização)](https://benjaminwfox.com/blog/tech/atomic-design-for-developers)

**Layout / app shell / navegação**
- [Shadcn — Application Shell](https://shadcnstudio.com/blocks/dashboard-and-application/application-shell) · [Dashboard Shell](https://shadcnstudio.com/blocks/dashboard-and-application/dashboard-shell)
- [Admin sidebar com shadcn/ui (freeCodeCamp)](https://www.freecodecamp.org/news/build-an-admin-dashboard-sidebar-with-shadcn-ui-and-base-ui/)
- [UX de navegação — padrões (Eleken)](https://www.eleken.co/blog-posts/ux-navigation-design)
- [Padrões de dashboard 2026](https://artofstyleframe.com/blog/dashboard-design-patterns-web-apps/) · [UX de dashboards (Pencil & Paper)](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Exemplos de sidebar (Navbar Gallery)](https://www.navbar.gallery/blog/best-side-bar-navigation-menu-design-examples)

**Documentação de componentes (anatomia/variantes/estados)**
- [Documentando design systems (Magic Patterns)](https://www.magicpatterns.com/blog/design-system-documentation)
- [Component Spec (UX Collective)](https://uxdesign.cc/component-spec-the-design-system-component-delivery-5f88db6ccf7e)
- [Variantes: nomeação e escala (Penpot)](https://penpot.app/blog/how-to-use-component-variants-to-scale-your-design-system/)
- [Anatomia de componentes temáticos (Smashing)](https://www.smashingmagazine.com/2022/12/anatomy-themed-design-system-components/)

> Para tokens de cor/tipografia/responsividade/acessibilidade, ver [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

---

## 11. Design Brief — Layout & Componentes (aprovação)

```
Design Brief — Estrutura de layout e biblioteca de componentes
Layout     : App Shell (sidebar 256px + topbar + drawer mobile) + PageTemplate
Páginas    : Dashboard (grid métricas) · listas (CardGrid) · Kanban (board) · detalhe (Sheet)
Criar prim.: Textarea, Select, Checkbox, Switch, Dialog/ConfirmDialog, Toast, Tooltip
Criar comp.: PageHeader, FilterBar, EmptyState, StatCard, Topbar, MobileDrawer, VpsCard
Padronizar : estados (loading/vazio/erro), z-index, foco-trap, feedback (toast)
Riscos UX  : drawer mobile inexistente; confirm() nativo; selects nativos inconsistentes
Aprovado   : ( ) Sim   ( ) Não
```

**Decisões que preciso de você:**
1. Posso adotar o **App Shell com drawer mobile** (cria `Topbar` + `MobileDrawer`)?
2. Trocar `confirm()` nativo e selects nativos por **`ConfirmDialog`/`Select`** próprios?
3. Adicionar **Toast** de feedback (sucesso/erro) nas ações?
