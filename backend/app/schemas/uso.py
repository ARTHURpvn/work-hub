from pydantic import BaseModel


class UsoAgg(BaseModel):
    chamadas: int
    input_tokens: int
    output_tokens: int
    tokens: int
    custo_usd: float


class UsoResumo(BaseModel):
    total: UsoAgg
    mes: UsoAgg


class ClaudeModelo(BaseModel):
    model: str
    input: int
    output: int
    cache: int


class ClaudeHoje(BaseModel):
    date: str | None = None
    tokens: int = 0


class ClaudeCodeUso(BaseModel):
    disponivel: bool
    atualizado_em: str | None = None
    sessoes: int
    mensagens: int
    tokens_input: int
    tokens_output: int
    tokens_total: int
    cache_tokens: int
    por_modelo: list[ClaudeModelo]
    hoje: ClaudeHoje | None = None
