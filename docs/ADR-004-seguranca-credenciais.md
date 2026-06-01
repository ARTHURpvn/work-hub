# ADR-004 — Só o IP do SSH; segredos reais fora do app

**Status:** Aceito · **Contexto:** C-05, RN-03, NFR-001/004.

## Contexto
Projetos têm VPS e autenticação. Guardar chaves/segredos no dashboard cria um alvo de alto valor e risco de vazamento (incl. para o módulo LinkedIn).

## Decisão
- De SSH, armazenar **apenas o IP** (string). Nunca chave privada, usuário, porta ou senha.
- Segredos operacionais reais ficam **fora do app** (cofre externo / `.env` no servidor / 1Password/Vault).
- Tokens de integração (OAuth Google, senha de app iCloud) ficam **cifrados em repouso**, com chave de cifragem vinda de variável de ambiente, fora do banco.
- A denylist (RN-04) impede que `ssh_ip`, auth e membros cheguem ao conteúdo público.

## Consequências
- (+) Impacto de um vazamento de banco é drasticamente reduzido.
- (−) Conexões SSH reais são feitas pelo usuário fora do dashboard (o app só guarda a referência do IP).
