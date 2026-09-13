"""Regras de negócio dos exemplares.

O service decide se o pedido deve acontecer; o repositório só executa.
Operações que podem ser recusadas devolvem uma tupla (ok, dados_ou_erros),
que o Servidor traduz em status HTTP.

O status do exemplar não é escolhido na tela: ele muda sozinho, para
EMPRESTADO ao registrar um empréstimo e para DISPONIVEL na devolução. Assim
o status nunca contradiz a tabela de empréstimos.
"""

from pydantic import ValidationError

from app.models.exemplar import STATUS_DISPONIVEL, STATUS_EMPRESTADO, Exemplar
from app.repositories.emprestimo_repository import EmprestimoRepository
from app.repositories.exemplar_repository import ExemplarRepository
from app.repositories.livro_repository import LivroRepository

# Filtros que a tela pode enviar na listagem.
FILTROS = ("busca", "status")
STATUS_ACEITOS = (STATUS_DISPONIVEL, STATUS_EMPRESTADO)

# Mensagem usada pelo Servidor para responder 404 em vez de 400.
NAO_ENCONTRADO = "Exemplar não encontrado."

STATUS_SO_POR_EMPRESTIMO = (
    "O status do exemplar muda sozinho: vira EMPRESTADO ao registrar um empréstimo "
    "e DISPONIVEL na devolução."
)


class ExemplarService:
    """Valida e coordena as operações com exemplares."""

    def __init__(self, repository: ExemplarRepository, livro_repository: LivroRepository,
                 emprestimo_repository: EmprestimoRepository):
        self.repository = repository
        self.livro_repository = livro_repository
        self.emprestimo_repository = emprestimo_repository

    def listar(self, filtros: dict) -> list[dict]:
        """Remove os filtros vazios ou desconhecidos e repassa ao repositório.

        Com status=DISPONIVEL, devolve só os exemplares que podem ser emprestados.
        """
        filtros = {chave: valor.strip() for chave, valor in filtros.items() if chave in FILTROS and valor.strip()}
        if "status" in filtros:
            filtros["status"] = filtros["status"].upper()
            if filtros["status"] not in STATUS_ACEITOS:
                del filtros["status"]
        return [exemplar.model_dump(mode="json") for exemplar in self.repository.listar(**filtros)]

    def cadastrar(self, dados: dict) -> tuple[bool, dict | list[str]]:
        """Valida, confere se o livro existe e cria o exemplar como DISPONIVEL."""
        try:
            exemplar = Exemplar.model_validate(dados)
        except ValidationError as erro:
            return False, Exemplar.mensagens_de_erro(erro)

        if self.livro_repository.buscar_por_id(exemplar.id_livro) is None:
            return False, ["O livro selecionado não existe."]

        if exemplar.status != STATUS_DISPONIVEL:
            return False, [STATUS_SO_POR_EMPRESTIMO]

        criado = self.repository.criar(exemplar.model_copy(update={"id_exemplar": None, "titulo_livro": None}))
        return True, self.repository.buscar_por_id(criado.id_exemplar).model_dump(mode="json")

    def editar(self, id_exemplar: int, dados: dict) -> tuple[bool, dict | list[str]]:
        """Confere se existe e se não está emprestado, valida e troca o livro do exemplar."""
        atual = self.repository.buscar_por_id(id_exemplar)
        if atual is None:
            return False, [NAO_ENCONTRADO]

        if atual.status == STATUS_EMPRESTADO:
            return False, ["Este exemplar está emprestado. Registre a devolução antes de alterá-lo."]

        try:
            exemplar = Exemplar.model_validate(dados)
        except ValidationError as erro:
            return False, Exemplar.mensagens_de_erro(erro)

        if self.livro_repository.buscar_por_id(exemplar.id_livro) is None:
            return False, ["O livro selecionado não existe."]

        if exemplar.status != atual.status:
            return False, [STATUS_SO_POR_EMPRESTIMO]

        self.repository.atualizar(exemplar.model_copy(update={"id_exemplar": id_exemplar, "titulo_livro": None}))
        return True, self.repository.buscar_por_id(id_exemplar).model_dump(mode="json")

    def remover(self, id_exemplar: int) -> tuple[bool, dict | list[str]]:
        """Exclui o exemplar só se ele nunca foi emprestado.

        Três casos:
        1. EMPRESTADO: bloqueia, porque há um empréstimo em aberto.
        2. DISPONIVEL, mas já emprestado antes: bloqueia, para não apagar o
           histórico (a chave estrangeira do banco também impediria).
        3. Nunca emprestado: exclui.
        """
        exemplar = self.repository.buscar_por_id(id_exemplar)
        if exemplar is None:
            return False, [NAO_ENCONTRADO]

        if exemplar.status == STATUS_EMPRESTADO:
            return False, ["Este exemplar está emprestado e não pode ser excluído."]

        if self.emprestimo_repository.existe_para_exemplar(id_exemplar):
            return False, [
                "Este exemplar já foi emprestado antes e não pode ser excluído, "
                "para não apagar o histórico de empréstimos."
            ]

        self.repository.excluir(id_exemplar)
        return True, exemplar.model_dump(mode="json")
