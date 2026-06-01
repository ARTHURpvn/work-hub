import pytest
from pydantic import ValidationError

from app.schemas.projeto import ProjetoCreate
from app.schemas.vps import VpsCreate, VpsUpdate


# --- URLs de projeto (github_url / site_url) ---


def test_projeto_aceita_urls_http_https():
    p = ProjetoCreate(
        nome="X",
        origem="Freelas",
        github_url="https://github.com/user/repo",
        site_url="http://meusite.com",
    )
    assert p.github_url == "https://github.com/user/repo"
    assert p.site_url == "http://meusite.com"


def test_projeto_url_vazia_vira_none():
    p = ProjetoCreate(nome="X", origem="Freelas", github_url="   ", site_url="")
    assert p.github_url is None
    assert p.site_url is None


def test_projeto_url_sem_esquema_falha():
    with pytest.raises(ValidationError):
        ProjetoCreate(nome="X", origem="Freelas", site_url="meusite.com")


def test_projeto_url_javascript_falha():
    with pytest.raises(ValidationError):
        ProjetoCreate(nome="X", origem="Freelas", github_url="javascript:alert(1)")


# --- VPS ---


def test_vps_ip_valido():
    v = VpsCreate(nome="Contabo-01", ip="203.0.113.10", provedor="Contabo")
    assert v.ip == "203.0.113.10"


def test_vps_nome_e_provedor_opcionais():
    v = VpsCreate(ip="10.0.0.1")
    assert v.nome is None and v.provedor is None


def test_vps_ip_invalido_falha():
    with pytest.raises(ValidationError):
        VpsCreate(ip="nao-e-ip")


def test_vps_update_ip_none_ok():
    u = VpsUpdate(nome="novo nome")
    assert u.ip is None
