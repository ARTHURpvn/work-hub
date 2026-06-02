# Layout & Componentes — workhub

> Documentação **as-built** da estrutura de layout (app shell, telas) e do catálogo de
> componentes **como implementados**. Complemento do
> [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (cor/tipografia/tokens).

---

## 1. App Shell

Padrão SaaS: **sidebar fixa + topbar + área de conteúdo rolável**. Implementado em
`components/layout/AppLayout.tsx`.

```
┌────────────┬─────────────────────────────────────────────┐
│ SIDEBAR    │  TOPBAR  (☰ · busca ⌘K · 🌗 tema · avatar)   │ 60px
│ 232px      ├─────────────────────────────────────────────┤
│ brand "w"  │  .scroll (área rolável)                      │
│ ───────    │   .page  (max-w 1180px, centralizado)        │
│ Dashboard  │    ┌ .page-head (h1 + ação primária) ──────┐ │
│ Projetos ② │    ├ filtros (chips/select/seg) ───────────┤ │
│ Tarefas  ⑤ │    ├ conteúdo (grid/board/lista)            │ │
│ Kanban     │    │  estados: loading · vazio · dados · erro│ │
│ VPS      ① │    └─────────────────────────────────────────┘ │
│ Calendário │                                              │
│ Skills   ③ │                                              │
│ ───────    │                                              │
│ Agentes ⊘  │   (Agentes/Jobs: desabilitados)              │
│ Jobs    ⊘  │                                              │
│ ───────    │                                              │
│ Sair       │                                              │
└────────────┴─────────────────────────────────────────────┘
```

- **Sidebar** (`layout/Sidebar.tsx`): marca "w", nav com **badges de contagem real**
  (projetos ativos, tarefas abertas, VPS, skills — via hooks), itens **Agentes/Jobs**
  desabilitados, e **Sair** (logout) no rodapé.
- **Topbar** (`layout/Topbar.tsx`): botão ☰ (só mobile), **busca** (abre paleta),
  **toggle de tema** (sol/lua) e avatar.
- **Busca ⌘K** (`layout/SearchPalette.tsx`): paleta global (modal) que pesquisa
  projetos, tarefas e VPS; `Cmd/Ctrl+K` abre; resultado navega ou abre a tarefa.
- **Modal de tarefa global** (`tarefas/TarefaModal.tsx`): montado no shell, abrível de
  qualquer tela via `store/taskModalStore.ts`.

### Mobile (≤760px)
A sidebar vira **drawer off-canvas**: `body.nav-open` desliza a sidebar e mostra um scrim;
o botão ☰ na topbar abre, navegar/clique no scrim fecha.

---

## 2. Padrão de tela

Não há um componente `PageTemplate` formal — cada página segue a mesma anatomia com
classes do design system:

```
<div className="page">
  <div className="page-head"> <h1 className="t-display"/> + <Button primary/> </div>
  <FilterBar> chips / <Select/> / .seg (ordenação) </FilterBar>
  conteúdo:
    loading → "Carregando…" / skeleton simples
    vazio   → <Empty icon title action/>
    dados   → grid de cards (.grid .g-3) | board | lista (.lrow)
    erro    → bloco com borda danger
</div>
```

---

## 3. Telas

| Rota | Tela | Resumo |
|---|---|---|
| `/login` | **Login** | card centralizado (`.login-card`), senha (+ TOTP opcional), toggle de senha |
| `/` | **Dashboard** | 4 KPIs · "Precisa de atenção" · progresso por projeto · barras por status · repositórios por VPS |
| `/projetos` | **Projetos** | grid de cards + filtro por origem + arquivados; **Drawer** ver→editar (descrição, links site/GitHub, VPS, **credencial cifrada** com revelar, tarefas do projeto). Sem delete (só arquivar) |
| `/tarefas` | **Tarefas** | lista com filtros (status/projeto/busca) + ordenação (`.seg`); abre o **modal central** |
| `/kanban` | **Kanban** | 4 colunas (A Fazer · Em Andamento · Em Revisão · Concluído), **drag no card inteiro** (HTML5 nativo) + filtro por projeto |
| `/vps` | **VPS** | grid de cards; **Drawer** criar/ver→editar; projetos vinculados; delete com confirmação |
| `/calendario` | **Calendário** | grade mensal de prazos (eventos clicáveis) + painel de Integrações (Google/iCloud + Sincronizar) + próximos prazos |
| `/skills` | **Skills** | cards por fonte (Minhas/Plugins/Desktop) + filtros; clicar abre a tela de detalhe |
| `/skills/:origem/:slug` | **SkillDetail** | tela cheia: **chat "Melhorar com IA"** (altura total, composer fixo na base) à esquerda + **conteúdo do SKILL.md** (editável) à direita; aplicar sugestão atualiza o conteúdo. Externas: leitura + importar |

### Detalhe ver→editar (Drawer)
Projetos e VPS usam um **Drawer lateral direito** (`ui/Drawer.tsx`): abre em modo
**leitura**; botão **Editar** troca para o formulário; salvar persiste e volta à leitura.

### Modal de tarefa
`TarefaModal` (modal central `ui/Modal.tsx`, tamanho `lg`): título (auto-save com debounce),
projeto/status/prazo, descrição, **subtarefas** (checklist com progresso) e **links**.
Ligado aos endpoints reais (subtarefas/links/status), exclusão com confirmação.

---

## 4. Catálogo de componentes (implementado)

### Primitivos — `components/ui/`

| Componente | Arquivo | Notas |
|---|---|---|
| `Icon` | `Icon.tsx` | set de ícones SVG por `path` (stroke, herda `currentColor`) |
| `Button` | `kit.tsx` | variantes: padrão, `primary`, `ghost`, `danger`; tamanho `sm`; `icon`/`iconRight` |
| `IconButton` | `kit.tsx` | botão quadrado só-ícone (`.iconbtn`) |
| `Field` + `TextInput` / `TextArea` / `Select` | `kit.tsx` | label + hint; classes `.input/.textarea/.select` |
| `Check` | `kit.tsx` | checkbox custom (subtarefas) |
| `Progress` | `kit.tsx` | barra (`.bar-track/.bar-fill`) |
| `OriginTag` | `kit.tsx` | tag de origem (cor por dono) |
| `StatusPill` | `kit.tsx` | pill de status / vencida |
| `Empty` | `kit.tsx` | estado vazio (ícone + título + descrição + ação) |
| `Modal` | `Modal.tsx` | overlay central; `size="lg"`; fecha no Esc/overlay; header opcional + footer |
| `Drawer` | `Drawer.tsx` | painel lateral direito; mesmas regras de fechar |
| `Toaster` | `toaster.tsx` | toasts (success/error/info) — `store/toastStore.ts` |
| `ConfirmRoot` | `confirm-dialog.tsx` | diálogo de confirmação — `store/confirmStore.ts` (`confirm()` imperativo) |

### Composições / organismos

| Componente | Arquivo |
|---|---|
| `AppLayout`, `Sidebar`, `Topbar`, `SearchPalette` | `components/layout/` |
| `TarefaModal` | `components/tarefas/TarefaModal.tsx` |
| Drawers de Projetos/VPS | inline em `pages/Projetos.tsx` e `pages/Vps.tsx` |
| Chat + editor de skill | `pages/SkillDetail.tsx` |

> Não usamos mais componentes shadcn (`button/badge/dialog/input/select/…`) — foram
> substituídos por `kit`/`Modal`/`Drawer`/`Icon` sobre o CSS do design system.

---

## 5. Feedback e interação

- **Toasts** para salvar/criar/excluir (sucesso/erro), canto inferior, somem sozinhos.
- **ConfirmDialog** (`confirm()` imperativo) para toda ação destrutiva (excluir tarefa/VPS,
  remover credencial), com variante `danger`.
- **Optimistic update** no Kanban (status reverte em erro).
- **Chat de skill**: indicador de "digitando", sugestões rápidas, **diff** da proposta e
  botão **Aplicar** (só altera o arquivo ao confirmar); preview/edição ao vivo do conteúdo.

---

## 6. Camadas (z-index)

| Camada | z-index |
|---|---|
| sidebar | 40 |
| topbar | 30 |
| scrim do drawer mobile | 39 |
| overlay (modal/drawer) | 100 |
| toasts | 200 |

---

## 7. Onde está no código

```
frontend/src/
├── components/
│   ├── ui/        # Icon, kit, Modal, Drawer, toaster, confirm-dialog
│   ├── layout/    # AppLayout, Sidebar, Topbar, SearchPalette
│   └── tarefas/   # TarefaModal
├── pages/         # Login, Dashboard, Projetos, Tarefas, Kanban, Vps, Calendario, Skills, SkillDetail
├── store/         # themeStore, taskModalStore, toastStore, confirmStore, authStore, uiStore, tarefaStore
├── hooks/  api/   # react-query + chamadas REST
└── lib/domain.ts  # origem/status/datas/progresso
```

Para cor, tipografia, tokens e responsividade, ver
[`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).
