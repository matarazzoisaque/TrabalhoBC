"""Entidade Empréstimo, validada pelo pydantic.

A situação (ATIVO ou DEVOLVIDO) não é gravada: ela sai da data de devolução.
Enquanto a data for NULL, o empréstimo está ativo.

O prazo em dias só existe na entrada: o service o transforma na data prevista
de devolução, que é o que fica gravado no banco.
"""

from datetime import date

from pydantic import BaseModel, Field, ValidationError, computed_field, field_validator
from pydantic_core import PydanticCustomError

SITUACAO_ATIVO = "ATIVO"
SITUACAO_DEVOLVIDO = "DEVOLVIDO"

PRAZO_MINIMO_DIAS = 1
PRAZO_MAXIMO_DIAS = 365

# Nome de cada campo como aparece para o usuário.
ROTULOS = {
    "id_leitor": "leitor",
    "id_exemplar": "exemplar",
    "data_emprestimo": "data do empréstimo",
    "prazo_dias": "prazo de devolução",
}

# Mensagens em português para os erros do pydantic.
MENSAGENS = {
    "missing": "O campo {campo} é obrigatório.",
    "campo_vazio": "O campo {campo} é obrigatório.",
    "int_parsing": "O campo {campo} deve ser um número inteiro.",
    "int_type": "O campo {campo} deve ser um número inteiro.",
    "int_from_float": "O campo {campo} deve ser um número inteiro.",
    "date_parsing": "O campo {campo} deve ser uma data válida.",
    "date_from_datetime_parsing": "O campo {campo} deve ser uma data válida.",
    "date_type": "O campo {campo} deve ser uma data válida.",
}


class Emprestimo(BaseModel):
    """Um empréstimo de um exemplar para um leitor."""

    id_emprestimo: int | None = None
    id_leitor: int
    id_exemplar: int
    data_emprestimo: date
    # Só na entrada: não aparece nas respostas nem é gravado.
    prazo_dias: int = Field(exclude=True)
    data_prevista_devolucao: date | None = None
    data_devolucao: date | None = None
    # Vêm dos JOINs com leitores, exemplares e livros, só para exibir; não são gravados.
    nome_leitor: str | None = None
    id_livro: int | None = None
    titulo_livro: str | None = None

    @computed_field
    @property
    def situacao(self) -> str:
        """ATIVO enquanto o empréstimo não tiver data de devolução."""
        return SITUACAO_ATIVO if self.data_devolucao is None else SITUACAO_DEVOLVIDO

    @field_validator("id_leitor", "id_exemplar", "data_emprestimo", "prazo_dias", mode="before")
    @classmethod
    def campo_preenchido(cls, valor):
        """Campo em branco é "obrigatório", e não "valor inválido"."""
        if valor is None or str(valor).strip() == "":
            raise PydanticCustomError("campo_vazio", "Campo obrigatório.")
        return valor

    @field_validator("data_emprestimo")
    @classmethod
    def data_nao_futura(cls, data_emprestimo: date) -> date:
        """Não dá para registrar um empréstimo que ainda não aconteceu."""
        if data_emprestimo > date.today():
            raise PydanticCustomError("data_futura", "A data do empréstimo não pode ser futura.")
        return data_emprestimo

    @field_validator("prazo_dias")
    @classmethod
    def prazo_no_intervalo(cls, prazo_dias: int) -> int:
        """O prazo vai de PRAZO_MINIMO_DIAS a PRAZO_MAXIMO_DIAS dias."""
        if not PRAZO_MINIMO_DIAS <= prazo_dias <= PRAZO_MAXIMO_DIAS:
            raise PydanticCustomError(
                "prazo_fora_do_intervalo",
                "O prazo de devolução deve ser de {minimo} a {maximo} dias.",
                {"minimo": PRAZO_MINIMO_DIAS, "maximo": PRAZO_MAXIMO_DIAS},
            )
        return prazo_dias

    @staticmethod
    def mensagens_de_erro(erro: ValidationError) -> list[str]:
        """Traduz os erros do pydantic em mensagens para o usuário."""
        mensagens = []
        for item in erro.errors():
            campo = ROTULOS.get(item["loc"][0], item["loc"][0]) if item["loc"] else "empréstimo"
            modelo = MENSAGENS.get(item["type"])
            mensagens.append(modelo.format(campo=campo, **item.get("ctx", {})) if modelo else item["msg"])
        return mensagens
