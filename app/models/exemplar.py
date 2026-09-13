"""Entidade Exemplar: a cópia física de um livro, validada pelo pydantic."""

from typing import Literal

from pydantic import BaseModel, ValidationError, field_validator
from pydantic_core import PydanticCustomError

STATUS_DISPONIVEL = "DISPONIVEL"
STATUS_EMPRESTADO = "EMPRESTADO"

# Nome de cada campo como aparece para o usuário.
ROTULOS = {
    "id_livro": "livro",
    "status": "status",
}

# Mensagens em português para os erros do pydantic.
MENSAGENS = {
    "missing": "O campo {campo} é obrigatório.",
    "campo_vazio": "O campo {campo} é obrigatório.",
    "int_parsing": "O campo {campo} deve ser um número inteiro.",
    "int_type": "O campo {campo} deve ser um número inteiro.",
    "literal_error": "O campo {campo} deve ser DISPONIVEL ou EMPRESTADO.",
}


class Exemplar(BaseModel):
    """Um exemplar físico de um livro do acervo."""

    id_exemplar: int | None = None
    id_livro: int
    status: Literal["DISPONIVEL", "EMPRESTADO"] = STATUS_DISPONIVEL
    # Vem do JOIN com a tabela livros, só para exibir; não é gravado.
    titulo_livro: str | None = None

    @field_validator("id_livro", mode="before")
    @classmethod
    def livro_preenchido(cls, valor):
        """Livro em branco é "obrigatório", e não "número inválido"."""
        if valor is None or str(valor).strip() == "":
            raise PydanticCustomError("campo_vazio", "Campo obrigatório.")
        return valor

    @field_validator("status", mode="before")
    @classmethod
    def status_em_maiusculas(cls, valor):
        """Aceita " disponivel " e guarda do jeito que o banco espera."""
        return valor.strip().upper() if isinstance(valor, str) else valor

    @staticmethod
    def mensagens_de_erro(erro: ValidationError) -> list[str]:
        """Traduz os erros do pydantic em mensagens para o usuário."""
        mensagens = []
        for item in erro.errors():
            campo = ROTULOS.get(item["loc"][0], item["loc"][0]) if item["loc"] else "exemplar"
            modelo = MENSAGENS.get(item["type"])
            mensagens.append(modelo.format(campo=campo, **item.get("ctx", {})) if modelo else item["msg"])
        return mensagens
