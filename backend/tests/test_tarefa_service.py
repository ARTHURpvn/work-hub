import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.tarefa_service import update_status


def make_tarefa(status: str, retornou: bool = False, retornos: int = 0) -> MagicMock:
    t = MagicMock()
    t.status = status
    t.retornou_de_revisao = retornou
    t.revisao_retornos = retornos
    return t


@pytest.mark.asyncio
async def test_rn02_saindo_de_revisao_para_a_fazer():
    session = AsyncMock()
    tarefa = make_tarefa("Em Revisao")
    result = await update_status(session, tarefa, "A Fazer")
    assert result.retornou_de_revisao is True
    assert result.revisao_retornos == 1
    assert result.status == "A Fazer"


@pytest.mark.asyncio
async def test_rn02_saindo_de_revisao_para_em_andamento():
    session = AsyncMock()
    tarefa = make_tarefa("Em Revisao", retornou=True, retornos=1)
    result = await update_status(session, tarefa, "Em Andamento")
    assert result.retornou_de_revisao is True
    assert result.revisao_retornos == 2


@pytest.mark.asyncio
async def test_rn02_concluido_desliga_flag():
    session = AsyncMock()
    tarefa = make_tarefa("Em Andamento", retornou=True, retornos=2)
    result = await update_status(session, tarefa, "Concluido")
    assert result.retornou_de_revisao is False
    assert result.status == "Concluido"


@pytest.mark.asyncio
async def test_rn02_transicao_normal_nao_afeta_flag():
    session = AsyncMock()
    tarefa = make_tarefa("A Fazer")
    result = await update_status(session, tarefa, "Em Andamento")
    assert result.retornou_de_revisao is False
    assert result.revisao_retornos == 0
    assert result.status == "Em Andamento"


@pytest.mark.asyncio
async def test_rn02_nao_incrementa_fora_de_revisao():
    session = AsyncMock()
    tarefa = make_tarefa("Em Andamento")
    result = await update_status(session, tarefa, "A Fazer")
    assert result.revisao_retornos == 0
    assert result.retornou_de_revisao is False
