# GLOSSARY — Glossário do domínio

| Termo | Definição neste projeto |
|---|---|
| **Agente** | Uma execução da Claude com loop de ferramentas — seja uma sessão do Claude Code lida do disco, seja um job iniciado pelo dashboard via Agent SDK. |
| **Job** | Uma execução agendada ou disparada (um agente em andamento, um cron). Tem ciclo de vida: enfileirado → rodando → concluído/falhou/cancelado. |
| **Skill** | Pasta com `SKILL.md` (frontmatter `name`/`description` + instruções) que a Claude carrega. Pode ter escopo global (`~/.claude/skills/`), de projeto (`.claude/skills/`) ou vir de plugin. |
| **Sessão (Claude Code)** | Transcrição completa de uma conversa do Claude Code, gravada como JSONL em `~/.claude/projects/<hash>/`. Apagada automaticamente com o tempo. |
| **Agent SDK** | `claude-agent-sdk` (Python). Roda o mesmo loop do Claude Code de forma programável — usado para iniciar/parar/monitorar jobs que o dashboard possui. |
| **Origem (de projeto)** | Fonte do projeto: `Otávio`, `Titan` ou `Freelas`. Define a regra de sanitização para o LinkedIn (RN-04). |
| **SSH IP** | Apenas o endereço IP da VPS de um projeto. É o **único** dado de acesso que o sistema guarda; nunca chave/usuário/porta/senha. |
| **Tarefa** | Unidade de trabalho única exibida em duas visões (lista e Kanban). Status compartilhado entre as visões. |
| **Retornou de revisão** | Flag de uma tarefa que saiu de `Em Revisão` de volta para um status anterior; tem contador de retornos. |
| **Publicável** | Flag que marca um item (projeto/tarefa/aprendizado) como liberado para entrar em conteúdo de LinkedIn, sujeito à sanitização (RN-04). |
| **Sanitização** | Processo que remove/oculta dados sensíveis e aplica a regra por origem antes de qualquer geração de conteúdo público. |
| **Denylist / Allowlist** | Denylist: campos que nunca podem sair (SSH IP, auth, membros, credenciais). Allowlist: só sai o que está marcado `publicavel`. |
