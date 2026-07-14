#!/usr/bin/env bash
#
# Deploy do workhub na VPS (Docker + nginx do host na frente).
#
# Uso:
#   ./deploy.sh            # git pull + build + up + migrations
#   SKIP_PULL=1 ./deploy.sh  # não faz git pull (usa o código atual)
#
set -euo pipefail

# sempre roda a partir da pasta do projeto (onde está este script)
cd "$(dirname "$0")"

# ------------------------------------------------------------------
# 1. Atualiza o código (fast-forward; falha se houver divergência)
# ------------------------------------------------------------------
if [ "${SKIP_PULL:-0}" != "1" ]; then
  echo "→ git pull --ff-only origin main"
  git pull --ff-only origin main
fi

# ------------------------------------------------------------------
# 2. compose.env — só as variáveis que o Docker Compose interpola.
#    O .env completo tem o ADMIN_PASSWORD_HASH (argon2, cheio de '$'),
#    que faz o Compose emitir aqueles WARN. Aqui geramos um arquivo
#    enxuto (sem '$') só para a interpolação do Compose. Os containers
#    continuam lendo o .env completo (backend por volume, worker por
#    env_file), então nada muda para a aplicação.
# ------------------------------------------------------------------
if [ ! -f compose.env ]; then
  echo "→ gerando compose.env a partir do .env"
  grep -E '^(POSTGRES_|DOMAIN=|IP_ALLOWLIST=|CLAUDE_)' .env > compose.env
fi

# ------------------------------------------------------------------
# 3. Arquivos do Compose — inclui o override de produção se existir
#    (docker-compose.prod.yml prende o proxy em 127.0.0.1:8080 para o
#    nginx do host ficar na frente com o certificado).
# ------------------------------------------------------------------
files=(-f docker-compose.yml)
[ -f docker-compose.prod.yml ] && files+=(-f docker-compose.prod.yml)

dc=(docker compose --env-file compose.env "${files[@]}")

# ------------------------------------------------------------------
# 4. Build + sobe os serviços
# ------------------------------------------------------------------
echo "→ build + up -d"
"${dc[@]}" up --build -d

# ------------------------------------------------------------------
# 5. Migrations do banco (idempotente)
# ------------------------------------------------------------------
echo "→ alembic upgrade head"
"${dc[@]}" exec -T backend alembic upgrade head

echo
echo "✓ deploy concluído"
"${dc[@]}" ps
