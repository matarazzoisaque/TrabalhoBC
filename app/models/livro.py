"""Entidade Livro, validada pelo pydantic.

Ao criar um Livro, o pydantic confere todos os campos. Se algum estiver
inválido, levanta ValidationError e o objeto não é criado.
"""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator
from pydantic_core import PydanticCustomError

ANO_MINIMO = 1450

# Nome de cada campo como aparece para o usuário.
ROTULOS = {
    "titulo": "título",
    "autor": "autor",
    "genero": "gênero",
    "ano_lancamento": "ano de lançamento",
    "resumo": "resumo",
    "data_cadastro": "data de cadastro",
}

# Mensagens em português para os erros do pydantic.
MENSAGENS = {
    "missing": "O campo {campo} é obrigatório.",
    "campo_vazio": "O campo {campo} é obrigatório.",
    "string_too_short": "O campo {campo} é obrigatório.",
    "string_too_long": "O campo {campo} deve ter no máximo {max_length} caracteres.",
    "string_type": "O campo {campo} deve ser um texto.",
    "int_parsing": "O campo {campo} deve ser um número inteiro.",
    "int_type": "O campo {campo} deve ser um número inteiro.",
}


class Livro(BaseModel):
    """Um livro do acervo."""

    model_config = ConfigDict(str_strip_whitespace=True)

    id_livro: int | None = None
    titulo: str = Field(min_length=1, max_length=200)
    autor: str = Field(min_length=1, max_length=150)
    genero: str = Field(min_length=1, max_length=80)
    ano_lancamento: int
    resumo: str = Field(min_length=1, max_length=1000)
    data_cadastro: date = Field(default_factory=date.today)

    @field_validator("ano_lancamento", mode="before")
    @classmethod
    def ano_preenchido(cls, valor):
        """Ano em branco é "obrigatório", e não "número inválido"."""
        if valor is None or str(valor).strip() == "":
            raise PydanticCustomError("campo_vazio", "Campo obrigatório.")
        return valor

    @field_validator("ano_lancamento")
    @classmethod
    def validar_ano(cls, ano: int) -> int:
        """Aceita anos entre ANO_MINIMO e o ano atual."""
        ano_atual = date.today().year
        if not ANO_MINIMO <= ano <= ano_atual:
            raise PydanticCustomError(
                "ano_fora_do_intervalo",
                "O campo ano de lançamento deve estar entre {minimo} e {maximo}.",
                {"minimo": ANO_MINIMO, "maximo": ano_atual},
            )
        return ano

    @staticmethod
    def mensagens_de_erro(erro: ValidationError) -> list[str]:
        """Traduz os erros do pydantic em mensagens para o usuário."""
        mensagens = []
        for item in erro.errors():
            campo = ROTULOS.get(item["loc"][0], item["loc"][0]) if item["loc"] else "livro"
            modelo = MENSAGENS.get(item["type"])
            mensagens.append(modelo.format(campo=campo, **item.get("ctx", {})) if modelo else item["msg"])
        return mensagens
