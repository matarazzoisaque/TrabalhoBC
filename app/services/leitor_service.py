"""Regras de negócio dos leitores.

O service decide se o pedido deve acontecer; o repositório só executa.
Operações que podem ser recusadas devolvem uma tupla (ok, dados_ou_erros),
que o Servidor traduz em status HTTP.
"""

from datetime import date

from pydantic import ValidationError

from app.models.leitor import Leitor
from app.repositories.emprestimo_repository import EmprestimoRepository
from app.repositories.leitor_repository import LeitorRepository

# Filtros que a tela pode enviar na listagem.
FILTROS = ("busca",)

# Mensagem usada pelo Servidor para responder 404 em vez de 400.
NAO_ENCONTRADO = "Leitor não encontrado."


class LeitorService:
    """Valida e coordena as operações com leitores."""

    def __init__(self, repository: LeitorRepository, emprestimo_repository: EmprestimoRepository):
        self.repository = repository
        self.emprestimo_repository = emprestimo_repository

    def listar(self, filtros: dict) -> list[dict]:
        """Remove os filtros vazios ou desconhecidos e repassa ao repositório."""
        filtros = {chave: valor.strip() for chave, valor in filtros.items() if chave in FILTROS and valor.strip()}
        return [leitor.model_dump(mode="json") for leitor in self.repository.listar(**filtros)]

    def cadastrar(self, dados: dict) -> tuple[bool, dict | list[str]]:
        """Valida, confere o e-mail único e cria o leitor.

        O id e a data de cadastro são definidos pelo servidor, nunca pela tela.
        """
        try:
            leitor = Leitor.model_validate(dados)
        except ValidationError as erro:
            return False, Leitor.mensagens_de_erro(erro)

        if self.repository.existe_email(leitor.email):
            return False, ["Já existe um leitor com esse e-mail."]

        leitor = leitor.model_copy(update={"id_leitor": None, "data_cadastro": date.today()})
        return True, self.repository.criar(leitor).model_dump(mode="json")

    def editar(self, id_leitor: int, dados: dict) -> tuple[bool, dict | list[str]]:
        """Confere se existe, valida, confere o e-mail único e atualiza.

        O id e a data de cadastro do leitor original são mantidos.
        """
        atual = self.repository.buscar_por_id(id_leitor)
        if atual is None:
            return False, [NAO_ENCONTRADO]

        try:
            leitor = Leitor.model_validate(dados)
        except ValidationError as erro:
            return False, Leitor.mensagens_de_erro(erro)

        if self.repository.existe_email(leitor.email, ignorar_id=id_leitor):
            return False, ["Já existe um leitor com esse e-mail."]

        leitor = leitor.model_copy(update={"id_leitor": id_leitor, "data_cadastro": atual.data_cadastro})
        return True, self.repository.atualizar(leitor).model_dump(mode="json")

    def remover(self, id_leitor: int) -> tuple[bool, dict | list[str]]:
        """Confere se o leitor existe e se não tem empréstimos, e o exclui.

        Leitor com empréstimos não pode sair: a chave estrangeira do banco
        impediria, e o histórico se perderia.
        """
        leitor = self.repository.buscar_por_id(id_leitor)
        if leitor is None:
            return False, [NAO_ENCONTRADO]

        if self.emprestimo_repository.existe_para_leitor(id_leitor):
            return False, ["Este leitor tem empréstimos registrados e não pode ser excluído."]

        self.repository.excluir(id_leitor)
        return True, leitor.model_dump(mode="json")
