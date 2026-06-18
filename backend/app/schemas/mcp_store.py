from pydantic import BaseModel


class StoreEnv(BaseModel):
    name: str
    description: str | None = None
    required: bool = False
    secret: bool = False


class StoreDoc(BaseModel):
    label: str
    url: str


class StoreServer(BaseModel):
    name: str
    suggested_name: str
    title: str | None = None
    description: str | None = None
    version: str | None = None
    transport: str
    package_kind: str | None = None
    package_id: str | None = None
    command: str | None = None
    args: list[str] = []
    url: str | None = None
    env_required: list[StoreEnv] = []
    source_url: str | None = None
    docs: list[StoreDoc] = []
    install_command: str
    mcp_json: dict


class SearchResponse(BaseModel):
    servers: list[StoreServer]
    next_cursor: str | None = None


class PackageDoc(BaseModel):
    description: str | None = None
    readme: str | None = None
    homepage: str | None = None


class ImportRequest(BaseModel):
    name: str  # nome no registry (identificador)
    name_local: str | None = None  # override do name local (default = suggested_name)


class ImportResult(BaseModel):
    id: str
    name: str
