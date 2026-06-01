# TEST_STRATEGY — Estratégia de teste

## Princípios
Cobrir com testes a **lógica de negócio que erra silencioso e causa dano**: transição de status do Kanban (RN-01/02), restrição de SSH (RN-03), controle de jobs (RN-05) e **sanitização do LinkedIn (RN-04)** — esta última é crítica e tem cobertura reforçada.

## Níveis
| Nível | Ferramenta | Foco |
|---|---|---|
| Unitário (backend) | pytest | regras RN-02 (retorno de revisão), RN-03 (ssh_ip), RN-04 (sanitização), validação de SKILL.md |
| Unitário (frontend) | Vitest + Testing Library | reducers do Kanban, componentes de tarefa |
| Integração | pytest + Postgres efêmero (Docker) | endpoints da API, migrations Alembic, upsert idempotente do ingestor |
| E2E | Playwright | login+2FA+allowlist, mover card reflete na lista, criar projeto com VPS, iniciar/parar job |
| Contrato (Claude) | mocks/fakes do Agent SDK | iniciar/parar job sem chamar a API real |

## Casos obrigatórios (amostra)
- **RN-02:** `Em Revisão → Em Andamento` liga `retornou_de_revisao` e `revisao_retornos += 1`; `→ Concluído` desliga a flag.
- **RN-03:** salvar `ssh_ip` com `tem_vps=false` é rejeitado; com `true` guarda só o IP.
- **RN-04 (denylist):** nenhum rascunho gerado contém `ssh_ip`/auth/membros, mesmo se marcados `publicavel` por engano.
- **RN-04 (origem):** `Otávio`/`Titan` → empresa oculta, sem links; `Freelas` → dados reais sem itens comprometedores.
- **RN-05:** `stop` em agente `controlavel=false` retorna 403.
- **NFR-007:** JSONL malformado no ingestor é pulado e logado, worker segue vivo.

## Critério de pronto (DoD por feature)
Testes dos requisitos cobertos verdes · migration aplicada · sem segredo em log · responsivo verificado em 360px e desktop.
