"""Regressão de segurança: o env do subprocess `claude` não pode vazar segredos.

O CLI roda em modo headless executando prompt influenciado pelo usuário; por isso
`_env` usa allowlist em vez de herdar `**os.environ`.
"""
from app.services.claude_cli_service import _env

# Segredos do app que NUNCA podem chegar ao subprocess.
SEGREDOS = ("ENCRYPTION_KEY", "APP_SECRET_KEY", "ADMIN_PASSWORD_HASH", "DATABASE_URL")


def test_env_nao_vaza_segredos_do_app() -> None:
    env = _env("token-abc")
    for chave in SEGREDOS:
        assert chave not in env, f"{chave} vazou para o env do CLI"


def test_env_passa_o_minimo_necessario() -> None:
    env = _env("token-abc")
    assert env["CLAUDE_CODE_OAUTH_TOKEN"] == "token-abc"
    assert env["IS_SANDBOX"] == "1"
    assert env["HOME"] == "/tmp"
    assert env["CLAUDE_CONFIG_DIR"] == "/tmp/claude-cfg"
    assert env.get("PATH"), "PATH é necessário para localizar o binário claude"
