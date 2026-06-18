"""Testes da normalização do MCP Store (sem rede — funções puras)."""
from app.services import mcp_store_service as store


def test_slug_deriva_name_local_valido() -> None:
    assert store._slug("io.github.upstash/context7") == "context7"
    assert store._slug("ai.waystation/postgres") == "postgres"
    assert store._slug("Weird Name!!") == "weird-name"
    assert store._slug("") == "mcp"


def test_normalizar_npm_stdio() -> None:
    item = {"server": {
        "name": "io.github.upstash/context7",
        "title": "Context7",
        "description": "Docs",
        "version": "1.0.0",
        "packages": [{"registryType": "npm", "identifier": "@upstash/context7-mcp",
                      "transport": {"type": "stdio"}}],
        "repository": {"url": "https://github.com/upstash/context7"},
    }}
    n = store._normalizar(item)
    assert n is not None
    assert n["command"] == "npx"
    assert n["args"] == ["-y", "@upstash/context7-mcp"]
    assert n["transport"] == "stdio"
    assert n["suggested_name"] == "context7"
    assert n["source_url"] == "https://github.com/upstash/context7"
    assert "claude mcp add context7" in n["install_command"]
    assert "-- npx -y @upstash/context7-mcp" in n["install_command"]
    assert n["mcp_json"]["mcpServers"]["context7"]["command"] == "npx"


def test_normalizar_pypi_usa_uvx() -> None:
    item = {"server": {
        "name": "x/serena", "version": "1.0.0",
        "packages": [{"registryType": "pypi", "identifier": "serena-agent",
                      "transport": {"type": "stdio"}}],
    }}
    n = store._normalizar(item)
    assert n["command"] == "uvx"
    assert n["args"] == ["serena-agent"]


def test_normalizar_remote_http() -> None:
    item = {"server": {
        "name": "com.notion/mcp", "version": "1.0.0",
        "remotes": [{"type": "streamable-http", "url": "https://mcp.notion.com/mcp"}],
    }}
    n = store._normalizar(item)
    assert n["transport"] == "http"  # streamable-http normalizado
    assert n["url"] == "https://mcp.notion.com/mcp"
    assert n["package_kind"] == "remote"
    assert "--transport http" in n["install_command"]
    assert n["mcp_json"]["mcpServers"]["mcp"]["url"] == "https://mcp.notion.com/mcp"


def test_env_secret_por_heuristica_e_flag() -> None:
    item = {"server": {
        "name": "x/srv", "version": "1.0.0",
        "packages": [{"registryType": "npm", "identifier": "srv",
                      "transport": {"type": "stdio"},
                      "environmentVariables": [
                          {"name": "API_KEY", "isRequired": True},
                          {"name": "DEBUG", "isRequired": False},
                          {"name": "PLAIN", "isRequired": True, "isSecret": False},
                      ]}],
    }}
    n = store._normalizar(item)
    envs = {e["name"]: e for e in n["env_required"]}
    assert envs["API_KEY"]["secret"] is True  # heurística TOKEN|KEY|...
    assert envs["DEBUG"]["required"] is False
    assert envs["PLAIN"]["secret"] is False
    # só os required entram nos flags do comando
    assert "--env API_KEY=<VALOR>" in n["install_command"]
    assert "--env PLAIN=<VALOR>" in n["install_command"]
    assert "DEBUG" not in n["install_command"]


def test_normalizar_sem_nome_retorna_none() -> None:
    assert store._normalizar({"server": {}}) is None


def test_docs_links_repo_e_pacote() -> None:
    item = {"server": {
        "name": "io.github.upstash/context7", "version": "1.0.0",
        "packages": [{"registryType": "npm", "identifier": "@upstash/context7-mcp",
                      "transport": {"type": "stdio"}}],
        "repository": {"url": "https://github.com/upstash/context7"},
    }}
    n = store._normalizar(item)
    assert n["package_id"] == "@upstash/context7-mcp"
    labels = {d["label"]: d["url"] for d in n["docs"]}
    assert labels["Repositório"] == "https://github.com/upstash/context7"
    assert labels["npm"] == "https://www.npmjs.com/package/@upstash/context7-mcp"


def test_docs_links_pypi() -> None:
    n = store._normalizar({"server": {
        "name": "x/serena", "version": "1.0.0",
        "packages": [{"registryType": "pypi", "identifier": "serena-agent",
                      "transport": {"type": "stdio"}}],
    }})
    labels = {d["label"]: d["url"] for d in n["docs"]}
    assert labels["PyPI"] == "https://pypi.org/project/serena-agent/"
