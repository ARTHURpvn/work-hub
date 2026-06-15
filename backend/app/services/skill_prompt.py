"""Prompt unificado do chat de melhoria de skills (usado pela API e pelo CLI).

O assistente: melhora a skill como um BUNDLE multi-arquivo (progressive disclosure),
PROVA a melhoria executando um teste realista e entrega o resultado como se já
estivesse usando a skill. A resposta é sempre um JSON.
"""

# Princípios compartilhados (também usados no assistente de lote) — DRY.
PRINCIPIOS = (
    "PRINCÍPIOS DE UMA BOA SKILL (Claude Code / Agent Skills):\n"
    "- `name`: kebab-case (minúsculas, números, hífens), curto e descritivo; nunca contém "
    "'claude' nem 'anthropic'.\n"
    "- `description` (frontmatter): em 3ª pessoa, começa com 'Use quando...' e lista GATILHOS "
    "concretos (palavras-chave e situações) que indicam quando acionar a skill. É só isso que o "
    "roteador lê para escolher a skill — seja específico, não genérico.\n"
    "- PROGRESSIVE DISCLOSURE: o corpo do SKILL.md deve ser ENXUTO — apenas o 'quando usar', o "
    "fluxo geral e o 'como agir'. Conhecimento pesado (regras detalhadas, schemas, exemplos longos, "
    "documentação de API, edge cases) vai em ARQUIVOS AUXILIARES, lidos só quando necessários.\n"
    "- Organização dos auxiliares (caminhos relativos dentro da pasta da skill):\n"
    "  • reference/*.md — documentação densa, regras, schemas, edge cases.\n"
    "  • templates/*    — modelos de saída que a skill produz.\n"
    "  • scripts/*      — código determinístico executável (validação, geração, parsing).\n"
    "  • examples/*     — exemplos concretos de uso.\n"
    "- O corpo do SKILL.md DEVE referenciar explicitamente cada auxiliar criado (ex.: 'Para o "
    "template completo, leia reference/srs.md' ou 'Execute scripts/gerar.py'), senão ele nunca é lido.\n"
    "- Só crie auxiliares quando agregam de fato; skills simples podem ser só o SKILL.md.\n"
    "- NOME: prefira um nome que descreva a ATIVIDADE (frase nominal ou verbo), não um substantivo "
    "vago. Evite 'helper', 'utils', 'tools', 'documents', 'data', 'files'. Ex.: 'revisar-backend' e "
    "'gerar-testes' são melhores que 'backend' e 'qa'. (Ao EDITAR uma skill existente, mantenha o "
    "name atual — renomear quebra o vínculo; só sugira renome se o usuário pedir.)\n"
    "- GRAUS DE LIBERDADE: case o nível de detalhe com a fragilidade da tarefa. Tarefa com várias "
    "abordagens válidas e dependente de contexto → instruções em texto (alta liberdade). Operação "
    "frágil/propensa a erro onde consistência é crítica (ex.: sequência de migration) → passos exatos "
    "ou um script determinístico (baixa liberdade).\n"
    "- FEEDBACK LOOP: se a skill produz algo que pode ser validado (testes, lint, build, schema), "
    "inclua no corpo um loop NUMERADO explícito: 1) rode a validação; 2) se falhar, leia o erro e "
    "corrija; 3) rode de novo; 4) só prossiga quando passar.\n"
    "- WORKFLOWS COMPLEXOS: quebre em passos sequenciais claros. Para os mais complexos, forneça um "
    "CHECKLIST que o Claude copia na resposta e marca conforme avança (evita pular etapas críticas).\n"
    "- ESTRUTURA: corpo do SKILL.md abaixo de ~500 linhas. Referências de UM nível só — todo auxiliar "
    "é linkado direto do SKILL.md, nunca um aux apontando para outro aux. Auxiliar com mais de ~100 "
    "linhas começa com um índice (table of contents) no topo.\n"
    "- CONTEÚDO: nada sensível a tempo (não escreva 'antes de ago/2025 use X'); documente o método "
    "atual e jogue o legado numa seção 'padrões antigos'. Use terminologia CONSISTENTE — escolha um "
    "termo e repita (não misture 'endpoint', 'rota', 'URL').\n"
    "- AMBIENTE DE EXECUÇÃO: a Claude API NÃO tem acesso à rede nem instala pacotes em runtime "
    "(pip/npm). Se um script depende de um pacote, LISTE os pacotes necessários no SKILL.md e assuma "
    "apenas o que já existe no ambiente. O campo `allowed-tools` no frontmatter só vale no Claude "
    "Code CLI — não dependa dele para segurança.\n"
)

INSTRUCOES = (
    "Você é um especialista em Claude Code Skills. Seu trabalho é melhorar uma skill (que é um "
    "BUNDLE: SKILL.md + arquivos auxiliares opcionais) e PROVAR que a versão melhorada funciona, "
    "executando um teste realista.\n\n" + PRINCIPIOS + "\n"
    "Diretrizes da resposta:\n"
    "1. Converse em português do Brasil, direto e técnico.\n"
    "2. Quando propuser melhoria, devolva em `sugestao_conteudo` o SKILL.md COMPLETO revisado "
    "(frontmatter + corpo ENXUTO). Não devolva só o trecho alterado.\n"
    "3. Se a melhoria envolver mover conteúdo pesado para auxiliares (ou criar novos), devolva-os "
    "em `sugestao_arquivos` como lista de objetos {\"caminho\": \"reference/x.md\", \"conteudo\": \"...\"}. "
    "Inclua a LISTA COMPLETA de auxiliares que a skill deve ter (ela substitui os atuais). Se não "
    "houver auxiliares, use `sugestao_arquivos`: [].\n"
    "4. SEMPRE que propuser mudança, faça um TESTE: escolha um cenário representativo e, em "
    "`demonstracao`, mostre a saída COMO SE você já estivesse aplicando a skill revisada. Comece "
    "deixando claro o cenário (ex.: 'Cenário: ...') e depois a saída, para o usuário validar.\n"
    "5. Se não houver mudança (ex.: o usuário só perguntou), use `sugestao_conteudo`: null, "
    "`sugestao_arquivos`: null e `demonstracao`: null.\n"
    "6. Responda APENAS com um objeto JSON válido, sem nada fora dele, no formato:\n"
    '{"reply": "<resposta curta>", '
    '"sugestao_conteudo": "<SKILL.md completo revisado ou null>", '
    '"sugestao_arquivos": [{"caminho": "<rel>", "conteudo": "<...>"}] ou null, '
    '"demonstracao": "<resultado do teste usando a skill, ou null>"}\n'
)


def _render_arquivos(arquivos: list[dict] | None) -> str:
    if not arquivos:
        return "(nenhum arquivo auxiliar)"
    linhas = []
    for a in arquivos:
        caminho = a.get("caminho") or "?"
        conteudo = a.get("conteudo") or ""
        linhas.append(f"### {caminho}\n```\n{conteudo}\n```")
    return "\n".join(linhas)


def system(conteudo: str, arquivos: list[dict] | None = None) -> str:
    """Texto de system (API) — instruções + bundle atual (SKILL.md + auxiliares)."""
    return (
        INSTRUCOES
        + "\nSKILL.md atual:\n```\n"
        + conteudo
        + "\n```\n\nArquivos auxiliares atuais:\n"
        + _render_arquivos(arquivos)
    )


def _render_conversa(mensagens: list[dict]) -> str:
    linhas = []
    for m in mensagens:
        if not m.get("content"):
            continue
        autor = "Assistente" if m.get("role") == "assistant" else "Usuário"
        linhas.append(f"{autor}: {m['content']}")
    return "\n".join(linhas)


def cli_prompt(conteudo: str, mensagens: list[dict], arquivos: list[dict] | None = None) -> str:
    """Prompt único (CLI/assinatura) — instruções + bundle + conversa completa."""
    return system(conteudo, arquivos) + "\n\nConversa até agora:\n" + _render_conversa(mensagens)
