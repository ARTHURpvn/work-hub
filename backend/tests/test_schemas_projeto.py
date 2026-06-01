import pytest
from pydantic import ValidationError

from app.schemas.projeto import ProjetoCreate, ProjetoUpdate


def test_cria_projeto_valido():
    p = ProjetoCreate(nome="Workhub", origem="Freelas")
    assert p.ssh_ip is None
    assert p.tem_vps is False


def test_cria_projeto_com_vps_e_ip_valido():
    p = ProjetoCreate(nome="X", origem="Otavio", tem_vps=True, ssh_ip="192.168.1.10")
    assert p.ssh_ip == "192.168.1.10"


def test_rn03_ssh_ip_sem_vps_falha():
    with pytest.raises(ValidationError) as exc:
        ProjetoCreate(nome="X", origem="Freelas", tem_vps=False, ssh_ip="10.0.0.1")
    assert "RN-03" in str(exc.value)


def test_ip_com_porta_falha():
    with pytest.raises(ValidationError):
        ProjetoCreate(nome="X", origem="Titan", tem_vps=True, ssh_ip="192.168.1.1:22")


def test_hostname_falha():
    with pytest.raises(ValidationError):
        ProjetoCreate(nome="X", origem="Titan", tem_vps=True, ssh_ip="meuservidor.com")


def test_ip_v6_valido():
    p = ProjetoCreate(nome="X", origem="Titan", tem_vps=True, ssh_ip="2001:db8::1")
    assert p.ssh_ip == "2001:db8::1"


def test_update_tem_vps_false_limpa_ip():
    with pytest.raises(ValidationError):
        ProjetoUpdate(tem_vps=False, ssh_ip="10.0.0.1")


def test_update_parcial_sem_vps_nao_valida_ip():
    u = ProjetoUpdate(nome="Novo nome")
    assert u.ssh_ip is None
