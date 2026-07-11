# Paleta de Cores — workhub

Referência do sistema de cores do workhub para reaproveitar o mesmo padrão em outros projetos (landing pages, apps, dashboards).

- **Identidade:** paleta **laranja** (acento `#c96442`), neutros quentes no claro e **cinza neutro** no escuro (o acento laranja é o único toque de cor — evita o visual "marrom").
- **Fonte:** Open Sans (300–800, variable).
- **Mecânica:** tudo em **CSS custom properties**. `:root` = tema claro; `body.dark` sobrescreve para o escuro. Consome-se sempre via `var(--token)`, nunca hex cru — assim trocar de tema (ou de marca) é mudar um bloco só.

> Regra de ouro: **componente nunca usa hex direto.** Sempre `var(--token)`. Trocar a marca = editar só os dois blocos `:root` / `body.dark`.

---

## 1. Superfícies e fundo

Do mais fundo (página) ao mais elevado (chips/realces). Empilhe nesta ordem para dar profundidade.

| Token | Claro | Escuro | Onde usar |
|---|---|---|---|
| `--bg` | `#f4f1ea` | `#121316` | Fundo da página (body) |
| `--bg-2` | `#efebe1` | `#0e0f11` | Fundo de barras laterais / áreas recuadas (sidebar) |
| `--surface` | `#fbfaf6` | `#1b1c20` | Cards, modais, drawers (superfície principal) |
| `--surface-2` | `#f3efe6` | `#232428` | Hover de item, inputs, sub-superfícies |
| `--surface-3` | `#ece6d9` | `#2d2e33` | Realce mais alto: fundo de badge, pill neutro |

## 2. Texto

| Token | Claro | Escuro | Onde usar |
|---|---|---|---|
| `--text` | `#2a2620` | `#ededf0` | Texto principal, títulos |
| `--text-2` | `#5f594f` | `#b5b6bd` | Texto secundário, rótulos de campo |
| `--muted` | `#8a8276` | `#82838c` | Texto apagado, metadados, placeholders |

## 3. Bordas

| Token | Claro | Escuro | Onde usar |
|---|---|---|---|
| `--border` | `#e3dccd` | `#2a2b30` | Bordas padrão (cards, inputs, separadores) |
| `--border-2` | `#d4cab8` | `#383940` | Borda de mais contraste (hover, foco leve, scrollbar) |

## 4. Acento (a cor da marca)

O laranja. Use com parcimônia: ações primárias, item ativo, foco.

| Token | Claro | Escuro | Onde usar |
|---|---|---|---|
| `--accent` | `#c96442` | `#e8895f` | Botão primário, link/item ativo, ícone em destaque |
| `--accent-press` | `#b4543a` | `#f0986f` | Estado pressionado/hover do acento |
| `--accent-weak` | `#f1e2da` | `#2c241f` | Fundo suave do acento (item ativo, badge de destaque) |
| `--accent-text` | `#fff` | `#121316` | Texto/ícone **sobre** o acento (contraste) |
| `--ring` | `rgba(201,100,66,.28)` | `rgba(232,137,95,.34)` | Anel de foco (`:focus`), seleção de texto |

## 5. Semânticos (status)

Cada um tem a cor sólida (texto/ícone/borda) e a versão **`-weak`** (fundo do badge/pill/alerta).

| Papel | Token | Claro | `-weak` claro | Escuro | `-weak` escuro |
|---|---|---|---|---|---|
| Sucesso | `--ok` | `#3f8f55` | `#e2efe4` | `#5fb074` | `#233127` |
| Atenção | `--warn` | `#c2871f` | `#f4e9d2` | `#d6a445` | `#362d1a` |
| Erro / perigo | `--danger` | `#cf5a3c` | `#f6e1da` | `#e0795a` | `#3a2620` |
| Informação | `--info` | `#4a72c4` | `#e2e9f5` | `#7a9be0` | `#1f2433` |

Padrão de uso: `color: var(--danger); background: var(--danger-weak);` para pílulas/alertas.

## 6. Cores por origem/dono (tags)

Cores fixas para categorizar por dono/origem (tag colorida). Reaproveite como paleta categórica.

| Token | Cor | Claro | Escuro |
|---|---|---|---|
| `--o-otavio` | Laranja (= acento) | `#c96442` | `#e8895f` |
| `--o-titan` | Roxo | `#8a4fd8` | `#b08ce8` |
| `--o-free` | Âmbar | `#c2871f` | `#d6a445` |
| `--o-pess` | Verde | `#3f8f55` | `#5fb074` |

## 7. Sombras, raios e layout

| Token | Claro | Escuro |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(60,50,35,.06), 0 1px 3px rgba(60,50,35,.05)` | `0 1px 2px rgba(0,0,0,.3)` |
| `--shadow-md` | `0 4px 14px rgba(60,50,35,.09), 0 2px 6px rgba(60,50,35,.06)` | `0 4px 16px rgba(0,0,0,.4)` |
| `--shadow-lg` | `0 18px 48px rgba(45,38,25,.18), 0 6px 18px rgba(45,38,25,.10)` | `0 20px 52px rgba(0,0,0,.6), 0 6px 18px rgba(0,0,0,.4)` |

Raios: `--r-sm: 7px` · `--r-md: 10px` · `--r-lg: 14px` · `--r-xl: 20px`
Outros: `--ui: "Open Sans", system-ui, -apple-system, sans-serif` · `--side-w: 232px` (largura da sidebar)

---

## 8. Bloco pronto para colar

Copie no topo do CSS de qualquer projeto e passe a usar `var(--token)`. Alternar tema = adicionar/remover a classe `dark` no `<body>`.

```css
:root {
  /* superfícies */
  --bg: #f4f1ea;  --bg-2: #efebe1;
  --surface: #fbfaf6;  --surface-2: #f3efe6;  --surface-3: #ece6d9;
  /* texto */
  --text: #2a2620;  --text-2: #5f594f;  --muted: #8a8276;
  /* bordas */
  --border: #e3dccd;  --border-2: #d4cab8;
  /* acento */
  --accent: #c96442;  --accent-press: #b4543a;  --accent-weak: #f1e2da;  --accent-text: #fff;
  --ring: rgba(201, 100, 66, 0.28);
  /* semânticos */
  --ok: #3f8f55;  --ok-weak: #e2efe4;
  --warn: #c2871f;  --warn-weak: #f4e9d2;
  --danger: #cf5a3c;  --danger-weak: #f6e1da;
  --info: #4a72c4;  --info-weak: #e2e9f5;
  /* tags por origem */
  --o-otavio: #c96442;  --o-titan: #8a4fd8;  --o-free: #c2871f;  --o-pess: #3f8f55;
  /* sombras / raios / layout */
  --shadow-sm: 0 1px 2px rgba(60,50,35,0.06), 0 1px 3px rgba(60,50,35,0.05);
  --shadow-md: 0 4px 14px rgba(60,50,35,0.09), 0 2px 6px rgba(60,50,35,0.06);
  --shadow-lg: 0 18px 48px rgba(45,38,25,0.18), 0 6px 18px rgba(45,38,25,0.10);
  --r-sm: 7px;  --r-md: 10px;  --r-lg: 14px;  --r-xl: 20px;
  --ui: "Open Sans", system-ui, -apple-system, sans-serif;
  color-scheme: light;
}

body.dark {
  --bg: #121316;  --bg-2: #0e0f11;
  --surface: #1b1c20;  --surface-2: #232428;  --surface-3: #2d2e33;
  --text: #ededf0;  --text-2: #b5b6bd;  --muted: #82838c;
  --border: #2a2b30;  --border-2: #383940;
  --accent: #e8895f;  --accent-press: #f0986f;  --accent-weak: #2c241f;  --accent-text: #121316;
  --ring: rgba(232, 137, 95, 0.34);
  --ok: #5fb074;  --ok-weak: #233127;
  --warn: #d6a445;  --warn-weak: #362d1a;
  --danger: #e0795a;  --danger-weak: #3a2620;
  --info: #7a9be0;  --info-weak: #1f2433;
  --o-otavio: #e8895f;  --o-titan: #b08ce8;  --o-free: #d6a445;  --o-pess: #5fb074;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
  --shadow-lg: 0 20px 52px rgba(0,0,0,0.6), 0 6px 18px rgba(0,0,0,0.4);
  color-scheme: dark;
}
```

### Exemplos de aplicação

```css
/* Card */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--shadow-sm); color: var(--text); }

/* Botão primário */
.btn-primary { background: var(--accent); color: var(--accent-text); border-radius: var(--r-md); }
.btn-primary:hover { background: var(--accent-press); }

/* Badge de erro */
.badge-danger { color: var(--danger); background: var(--danger-weak); border-radius: 10px; }

/* Foco acessível */
:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
```

---

## 9. Princípios (para manter a coerência em outros lugares)

1. **Um acento só.** O laranja é o único destaque de marca; não introduza uma segunda cor "primária".
2. **Escuro é cinza neutro**, não marrom — só o acento carrega cor no tema escuro.
3. **Par cor + `-weak`.** Toda cor de status vira fundo com a versão `-weak`; nunca use a cor sólida como fundo de bloco grande.
4. **Escada de superfícies.** `bg` → `surface` → `surface-2/3` cria profundidade sem sombras pesadas.
5. **Contraste do acento** sempre com `--accent-text` (branco no claro, quase-preto no escuro).
6. **Tokens, não hex.** Qualquer cor nova entra como token nos dois temas antes de ser usada.

> Fonte da verdade no código: [`frontend/src/index.css`](../frontend/src/index.css) (blocos `:root` e `body.dark`).
