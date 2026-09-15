"""Regras de negócio dos empréstimos.

O service decide se o pedido deve acontecer; o repositório só executa.
Operações que podem ser recusadas devolvem uma tupla (ok, dados_ou_erros),
que o Servidor traduz em status HTTP.

Fluxo do empréstimo: confere o leitor, confere o exemplar, exige que ele
esteja DISPONIVEL, cria o empréstimo e o exemplar vira EMPRESTADO.
Fluxo da devolução: grava a data de devolução e o exemplar volta a DISPONIVEL.
"""

from datetime import date, timedelta

from pydantic import ValidationError

from app.models.emprestimo import SITUACAO_ATIVO, SITUACAO_DEVOLVIDO, Emprestimo
from app.models.exemplar import STATUS_DISPONIVEL
from app.repositories.emprestimo_repository import EmprestimoRepository
from app.repositories.exemplar_repository import ExemplarRepository
from app.repositories.leitor_repository import LeitorRepository

# Filtros que a tela pode enviar na listagem.
FILTROS = ("busca", "situacao", "ordem")
SITUACOES_ACEITAS = (SITUACAO_ATIVO, SITUACAO_DEVOLVIDO)

# Mensagem usada pelo Servidor para responder 404 em vez de 400.
NAO_ENCONTRADO = "Empréstimo não encontrado."


class EmprestimoService:
    """Valida e coordena os empréstimos e as devoluções."""

    def __init__(self, repository: EmprestimoRepository, leitor_repository: LeitorRepository,
                 exemplar_repository: ExemplarRepository):
        self.repository = repository
        self.leitor_repository = leitor_repository
        self.exemplar_repository = exemplar_repository

    def listar(self, filtros: dict) -> list[dict]:
        """Remove os filtros vazios ou desconhecidos e repassa ao repositório.

        Com situacao=ATIVO, devolve só os empréstimos ainda não devolvidos.
        """
        filtros = {chave: valor.strip() for chave, valor in filtros.items() if chave in FILTROS and valor.strip()}
        if "situacao" in filtros:
            filtros["situacao"] = filtros["situacao"].upper()
            if filtros["situacao"] not in SITUACOES_ACEITAS:
                del filtros["situacao"]
        return [emprestimo.model_dump(mode="json") for emprestimo in self.repository.listar(**filtros)]

    def registrar(self, dados: dict) -> tuple[bool, dict | list[str]]:
        """Valida, confere leitor e exemplar disponível e registra o empréstimo."""
        try:
            emprestimo = Emprestimo.model_validate(dados)
        except ValidationError as erro:
            return False, Emprestimo.mensagens_de_erro(erro)

        if self.leitor_repository.buscar_por_id(emprestimo.id_leitor) is None:
            return False, ["O leitor selecionado não existe."]

        exemplar = self.exemplar_repository.buscar_por_id(emprestimo.id_exemplar)
        if exemplar is None:
            return False, ["O exemplar selecionado não existe."]

        if exemplar.status != STATUS_DISPONIVEL:
            return False, ["O exemplar selecionado não está disponível para empréstimo."]

        # Um empréstimo novo sempre começa aberto: o id e a devolução não vêm da tela.
        # A data prevista sai do prazo digitado, e é ela que fica gravada.
        emprestimo = emprestimo.model_copy(update={
            "id_emprestimo": None,
            "data_devolucao": None,
            "data_prevista_devolucao": emprestimo.data_emprestimo + timedelta(days=emprestimo.prazo_dias),
        })
        criado = self.repository.registrar(emprestimo)
        return True, self.repository.buscar_por_id(criado.id_emprestimo).model_dump(mode="json")

    def registrar_devolucao(self, id_emprestimo: int) -> tuple[bool, dict | list[str]]:
        """Confere se o empréstimo existe e está aberto, e registra a devolução com a data de hoje."""
        emprestimo = self.repository.buscar_por_id(id_emprestimo)
        if emprestimo is None:
            return False, [NAO_ENCONTRADO]

        if emprestimo.data_devolucao is not None:
            return False, ["Este empréstimo já foi devolvido."]

        self.repository.registrar_devolucao(emprestimo, date.today())
        return True, self.repository.buscar_por_id(id_emprestimo).model_dump(mode="json")
