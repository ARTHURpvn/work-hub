# SETUP — De onde tirar cada valor do `.env`

Guia passo a passo. Faça na ordem — os primeiros 5 passos são obrigatórios
para o MVP rodar. O resto é para features futuras.

---

## Antes de começar

```bash
cp .env.example .env
```

Edite o `.env` conforme os passos abaixo.

---

## Passos obrigatórios (MVP — FEAT-01 a FEAT-05)

### Passo 1 — `APP_SECRET_KEY`
Chave para assinar os cookies de sessão. Gere localmente:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Cole o resultado no `.env`. Não compartilhe com ninguém.

---

### Passo 2 — `ENCRYPTION_KEY`
Chave Fernet para cifrar TOTP e tokens de calendário no banco.

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

> Se não tiver o pacote: `pip3 install cryptography`

---

### Passo 3 — `ADMIN_PASSWORD_HASH`
Hash Argon2 da sua senha de acesso ao dashboard.

```bash
python3 -c "from argon2 import PasswordHasher; print(PasswordHasher().hash('SUA_SENHA_AQUI'))"
```

> Se não tiver o pacote: `pip3 install argon2-cffi`

Substitua `SUA_SENHA_AQUI` pela senha que você vai usar para logar.
Cole **somente o hash** no `.env` — nunca a senha em texto.

---

### Passo 4 — `TOTP_SECRET` (opcional — 2FA)
Deixe **vazio** para desativar o 2FA. Para ativar:

```bash
python3 -c "import pyotp; print(pyotp.random_base32())"
```

> Se não tiver o pacote: `pip3 install pyotp`

Cole o resultado no `.env`. Depois, abra um app autenticador
(Google Authenticator, Authy, 1Password) e escaneie o QR code gerado por:

```bash
python3 -c "
import pyotp, qrcode
secret = 'COLE_O_SECRET_AQUI'
uri = pyotp.totp.TOTP(secret).provisioning_uri('admin', issuer_name='workhub')
img = qrcode.make(uri)
img.save('totp_qr.png')
print('QR salvo em totp_qr.png')
"
```

> `pip3 install qrcode[pil]` se precisar

---

### Passo 5 — `ANTHROPIC_API_KEY`
**Onde pegar:** https://console.anthropic.com → API Keys → Create Key

Necessário para o Worker usar o Claude Agent SDK (FEAT-08/09).
Para FEAT-01 a FEAT-05 (sem Worker ativo), pode deixar vazio por enquanto.

---

### Passo 6 — `POSTGRES_PASSWORD` e `DATABASE_URL`
Você escolhe a senha. Defina a mesma nos dois campos:

```env
POSTGRES_PASSWORD=minhasenhaforte123
DATABASE_URL=postgresql+asyncpg://workhub:minhasenhaforte123@db:5432/workhub
```

---

### Passo 7 — `DOMAIN` e `IP_ALLOWLIST`

**`DOMAIN`:** o domínio ou IP da sua VPS.
- Com domínio: `meusite.com`
- Só IP: `203.0.113.10`

**`IP_ALLOWLIST`:** o IP de onde você vai acessar o dashboard.
- Seu IP fixo: `203.0.113.1`
- Faixa da sua VPN: `10.8.0.0/24`
- Sem restrição (não recomendado): `0.0.0.0/0`

Para descobrir seu IP atual:
```bash
curl ifconfig.me
```

---

### Passo 8 — `CLAUDE_HOME`
Caminho do diretório `.claude` na VPS, no usuário que vai rodar o Worker.

```bash
# Na VPS, rode:
echo ~/.claude
```

Exemplo: `/home/arthur/.claude`

---

## Para desenvolvimento local

```env
APP_ENV=development
DOMAIN=localhost
IP_ALLOWLIST=0.0.0.0/0
CLAUDE_HOME=/Users/SEU_USUARIO/.claude
DATABASE_URL=postgresql+asyncpg://workhub:SENHA@db:5432/workhub
```

Suba com:
```bash
docker compose up -d
```

A API fica acessível em `http://localhost:8000` e o frontend em `http://localhost` (via Caddy) ou `http://localhost:5173` (via `cd frontend && npm run dev`).

---

## Passos futuros (preencher quando chegar na feature)

### Google Calendar (FEAT-07)

1. Acesse https://console.cloud.google.com
2. Crie um projeto (ou use um existente)
3. Ative a **Google Calendar API** (APIs e Serviços → Biblioteca)
4. Crie credenciais OAuth 2.0 (Credenciais → Criar → ID do cliente OAuth)
   - Tipo: **Aplicativo da Web**
   - URI de redirecionamento autorizado: `https://SEUDOMAIN/api/v1/auth/google/callback`
5. Copie **Client ID** → `GOOGLE_CLIENT_ID`
6. Copie **Client Secret** → `GOOGLE_CLIENT_SECRET`
7. Preencha `GOOGLE_REDIRECT_URI=https://SEUDOMAIN/api/v1/auth/google/callback`

---

### iCloud Calendar (FEAT-07)

1. Acesse https://appleid.apple.com
2. Faça login → **Login e Segurança → Senhas Específicas de App**
3. Gere uma senha com o nome "workhub"
4. Preencha:
   - `ICLOUD_APPLE_ID=seu@email.apple.com`
   - `ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx` (a senha gerada)

---

### LinkedIn (FEAT-11 — Fase 2)

1. Acesse https://www.linkedin.com/developers/apps → Criar app
2. Associe a uma Página do LinkedIn (obrigatório)
3. Em **Products**, solicite: `Sign In with LinkedIn` + `Share on LinkedIn`
   - ⚠️ A aprovação pode levar alguns dias
4. Em **Auth**, copie:
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`
5. Adicione a redirect URI: `https://SEUDOMAIN/api/v1/auth/linkedin/callback`
6. Preencha `LINKEDIN_REDIRECT_URI` com o mesmo valor

---

## Checklist rápido (MVP)

- [ ] `POSTGRES_PASSWORD` e `DATABASE_URL` definidos (mesma senha)
- [ ] `APP_SECRET_KEY` gerado (Passo 1)
- [ ] `ENCRYPTION_KEY` gerado (Passo 2)
- [ ] `ADMIN_PASSWORD_HASH` gerado com sua senha (Passo 3)
- [ ] `TOTP_SECRET` configurado ou deixado vazio (Passo 4)
- [ ] `DOMAIN` e `IP_ALLOWLIST` configurados (Passo 7)
- [ ] `CLAUDE_HOME` apontando para o caminho correto (Passo 8)
- [ ] `.env` **não commitado** (está no `.gitignore` ✅)
