"""Acesso aos dados da tabela exemplares.

Só SQL: monta o comando e os parâmetros e entrega para o Database executar.
Nenhuma regra de negócio, nenhuma mensagem para o usuário.

ExemplarRepositoryMemoria é a versão temporária, sem banco, com os mesmos
métodos.
"""

from app.core.database import Database
from app.models.exemplar import Exemplar
from app.repositories.livro_repository import LivroRepositoryMemoria, escapar_like, sem_acento

# O JOIN traz o título do livro, para a tela não precisar juntar os dados.
SELECT_EXEMPLARES = (
    "SELECT e.id_exemplar, e.id_livro, e.status, l.titulo AS titulo_livro "
    "FROM exemplares e JOIN livros l ON l.id_livro = e.id_livro"
)


class ExemplarRepository:
    """Comandos SQL da tabela exemplares."""

    def __init__(self, database: Database):
        self.database = database

    def criar(self, exemplar: Exemplar) -> Exemplar:
        """INSERT do exemplar. Devolve o exemplar já com o id gerado pelo banco."""
        sql = "INSERT INTO exemplares (id_livro, status) VALUES (%s, %s)"
        id_gerado = self.database.executar(sql, (exemplar.id_livro, exemplar.status))
        return exemplar.model_copy(update={"id_exemplar": id_gerado})

    def listar(self, busca: str | None = None, status: str | None = None) -> list[Exemplar]:
        """SELECT dos exemplares com o título do livro.

        Com status="DISPONIVEL", é a lista dos exemplares que podem ser emprestados.
        """
        sql = f"{SELECT_EXEMPLARES} WHERE 1 = 1"
        params = []
        if busca:
            sql += " AND l.titulo LIKE %s"
            params.append(f"%{escapar_like(busca)}%")
        if status:
            sql += " AND e.status = %s"
            params.append(status)
        sql += " ORDER BY l.titulo ASC, e.id_exemplar ASC"
        return [Exemplar.model_construct(**linha) for linha in self.database.consultar(sql, tuple(params))]

    def buscar_por_id(self, id_exemplar: int) -> Exemplar | None:
        """SELECT pelo id, com o título do livro. Devolve um Exemplar ou None."""
        linhas = self.database.consultar(f"{SELECT_EXEMPLARES} WHERE e.id_exemplar = %s", (id_exemplar,))
        return Exemplar.model_construct(**linhas[0]) if linhas else None

    def atualizar(self, exemplar: Exemplar) -> Exemplar:
        """UPDATE pelo id."""
        sql = "UPDATE exemplares SET id_livro = %s, status = %s WHERE id_exemplar = %s"
        self.database.executar(sql, (exemplar.id_livro, exemplar.status, exemplar.id_exemplar))
        return exemplar

    def excluir(self, id_exemplar: int) -> None:
        """DELETE pelo id."""
        self.database.executar("DELETE FROM exemplares WHERE id_exemplar = %s", (id_exemplar,))

    def existe_para_livro(self, id_livro: int) -> bool:
        """Diz se o livro tem algum exemplar cadastrado."""
        return bool(self.database.consultar("SELECT 1 FROM exemplares WHERE id_livro = %s LIMIT 1", (id_livro,)))


class ExemplarRepositoryMemoria:
    """Guarda os exemplares na memória do servidor, no lugar do MySQL.

    Recebe o repositório de livros para imitar o JOIN que traz o título.
    """

    def __init__(self, livro_repository: LivroRepositoryMemoria):
        self.livro_repository = livro_repository
        self.exemplares: list[Exemplar] = []
        # Imita o AUTO_INCREMENT do MySQL: o id nunca é reaproveitado.
        self.proximo_id = 1

    def _com_titulo(self, exemplar: Exemplar) -> Exemplar:
        """Imita o JOIN com livros."""
        livro = self.livro_repository.buscar_por_id(exemplar.id_livro)
        return exemplar.model_copy(update={"titulo_livro": livro.titulo if livro else None})

    def criar(self, exemplar: Exemplar) -> Exemplar:
        """Guarda o exemplar e devolve com o próximo id."""
        exemplar = exemplar.model_copy(update={"id_exemplar": self.proximo_id, "titulo_livro": None})
        self.proximo_id += 1
        self.exemplares.append(exemplar)
        return exemplar

    def listar(self, busca: str | None = None, status: str | None = None) -> list[Exemplar]:
        """Filtra e ordena do mesmo jeito que o SQL do ExemplarRepository."""
        exemplares = [self._com_titulo(exemplar) for exemplar in self.exemplares]
        if busca:
            termo = sem_acento(busca)
            exemplares = [exemplar for exemplar in exemplares if termo in sem_acento(exemplar.titulo_livro or "")]
        if status:
            exemplares = [exemplar for exemplar in exemplares if exemplar.status == status]
        return sorted(exemplares, key=lambda exemplar: (sem_acento(exemplar.titulo_livro or ""), exemplar.id_exemplar))

    def buscar_por_id(self, id_exemplar: int) -> Exemplar | None:
        """Devolve o exemplar com esse id e o título do livro, ou None."""
        exemplar = next((item for item in self.exemplares if item.id_exemplar == id_exemplar), None)
        return self._com_titulo(exemplar) if exemplar else None

    def atualizar(self, exemplar: Exemplar) -> Exemplar:
        """Troca o exemplar guardado por esta versão."""
        guardado = exemplar.model_copy(update={"titulo_livro": None})
        self.exemplares = [guardado if atual.id_exemplar == exemplar.id_exemplar else atual
                           for atual in self.exemplares]
        return exemplar

    def excluir(self, id_exemplar: int) -> None:
        """Tira o exemplar da lista."""
        self.exemplares = [exemplar for exemplar in self.exemplares if exemplar.id_exemplar != id_exemplar]

    def existe_para_livro(self, id_livro: int) -> bool:
        """Diz se o livro tem algum exemplar cadastrado."""
        return any(exemplar.id_livro == id_livro for exemplar in self.exemplares)
