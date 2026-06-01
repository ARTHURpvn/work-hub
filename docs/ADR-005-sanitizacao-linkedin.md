# ADR-005 — Sanitização de conteúdo do LinkedIn por origem

**Status:** Aceito · **Contexto:** Fase 2, FR-074, RN-04.

## Contexto
O cron de LinkedIn gera conteúdo a partir de dados do dashboard. Há dados sensíveis e regras de confidencialidade que variam pela origem do projeto.

## Decisão
Pipeline de sanitização obrigatório antes de qualquer geração:
1. **Denylist absoluta:** `ssh_ip`, `tem_autenticacao`, membros, hosts e credenciais nunca entram.
2. **Allowlist:** só itens com `publicavel = true` são candidatos.
3. **Regra por origem:**
   - `Otávio`/`Titan`: ocultar nome real da empresa ("Projeto X"), **sem** link de GitHub/site; permitidos prints aprovados + aprendizados.
   - `Freelas`: dados reais permitidos, exceto o que comprometa o projeto.
4. Geração com **system prompts versionados** para qualidade (não-genérico).
5. Modo inicial: **rascunho com preview WYSIWYG**; auto-publicação só após liberação explícita.

## Consequências
- (+) Risco de vazamento e quebra de confidencialidade controlado por padrão.
- (−) Exige curadoria (marcar `publicavel`) — intencional.
