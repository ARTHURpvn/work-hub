"""Testes de vps_service.set_projetos (vínculo Projeto↔VPS pelo lado da VPS)."""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.schemas.vps import VpsProjetosUpdate
from app.services.vps_service import set_projetos


def _res(ids: list[uuid.UUID]) -> MagicMock:
    r = MagicMock()
    r.scalars.return_value.all.return_value = ids
    return r


@pytest.mark.asyncio
async def test_set_projetos_raise_quando_projeto_inexistente() -> None:
    session = AsyncMock()
    session.execute = AsyncMock(return_value=_res([]))  # nenhum encontrado
    with pytest.raises(ValueError):
        await set_projetos(session, uuid.uuid4(), [uuid.uuid4()])


@pytest.mark.asyncio
async def test_set_projetos_vincula_e_desvincula() -> None:
    p1 = uuid.uuid4()
    session = AsyncMock()
    # execute: 1) validação (acha p1) 2) update desvincular 3) update vincular
    session.execute = AsyncMock(side_effect=[_res([p1]), _res([]), _res([])])
    await set_projetos(session, uuid.uuid4(), [p1])
    assert session.execute.await_count == 3
    session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_set_projetos_lista_vazia_so_desvincula() -> None:
    session = AsyncMock()
    session.execute = AsyncMock(return_value=_res([]))
    await set_projetos(session, uuid.uuid4(), [])
    # lista vazia: pula validação e o update de vincular -> só 1 execute (desvincular)
    assert session.execute.await_count == 1
    session.flush.assert_awaited()


def test_schema_vps_projetos_update() -> None:
    m = VpsProjetosUpdate(projeto_ids=[str(uuid.uuid4())])
    assert len(m.projeto_ids) == 1
    with pytest.raises(Exception):
        VpsProjetosUpdate(projeto_ids=["nao-e-uuid"])
