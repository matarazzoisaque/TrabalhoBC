"""Acesso aos dados da tabela leitores.

Só SQL: monta o comando e os parâmetros e entrega para o Database executar.
Nenhuma regra de negócio, nenhuma mensagem para o usuário.

LeitorRepositoryMemoria é a versão temporária, sem banco, com os mesmos
métodos.
"""

from app.core.database import Database
from app.models.leitor import Leitor
from app.repositories.livro_repository import escapar_like, sem_acento

COLUNAS = "id_leitor, nome, email, telefone, data_cadastro"


class LeitorRepository:
    """Comandos SQL da tabela leitores."""

    def __init__(self, database: Database):
        self.database = database

    def criar(self, leitor: Leitor) -> Leitor:
        """INSERT do leitor. Devolve o leitor já com o id gerado pelo banco."""
        sql = "INSERT INTO leitores (nome, email, telefone, data_cadastro) VALUES (%s, %s, %s, %s)"
        params = (leitor.nome, leitor.email, leitor.telefone, leitor.data_cadastro)
        return leitor.model_copy(update={"id_leitor": self.database.executar(sql, params)})

    def listar(self, busca: str | None = None) -> list[Leitor]:
        """SELECT dos leitores em ordem de nome, com busca opcional por nome ou e-mail."""
        sql = f"SELECT {COLUNAS} FROM leitores WHERE 1 = 1"
        params = []
        if busca:
            sql += " AND (nome LIKE %s OR email LIKE %s)"
            params += [f"%{escapar_like(busca)}%"] * 2
        sql += " ORDER BY nome ASC, id_leitor ASC"
        return [Leitor.model_construct(**linha) for linha in self.database.consultar(sql, tuple(params))]

    def buscar_por_id(self, id_leitor: int) -> Leitor | None:
        """SELECT pelo id. Devolve um Leitor ou None."""
        linhas = self.database.consultar(f"SELECT {COLUNAS} FROM leitores WHERE id_leitor = %s", (id_leitor,))
        return Leitor.model_construct(**linhas[0]) if linhas else None

    def atualizar(self, leitor: Leitor) -> Leitor:
        """UPDATE pelo id. A data de cadastro não muda na edição."""
        sql = "UPDATE leitores SET nome = %s, email = %s, telefone = %s WHERE id_leitor = %s"
        self.database.executar(sql, (leitor.nome, leitor.email, leitor.telefone, leitor.id_leitor))
        return leitor

    def excluir(self, id_leitor: int) -> None:
        """DELETE pelo id."""
        self.database.executar("DELETE FROM leitores WHERE id_leitor = %s", (id_leitor,))

    def existe_email(self, email: str, ignorar_id: int | None = None) -> bool:
        """Diz se o e-mail já está em uso. Na edição, ignora o próprio leitor."""
        sql = "SELECT 1 FROM leitores WHERE email = %s"
        params = [email]
        if ignorar_id is not None:
            sql += " AND id_leitor <> %s"
            params.append(ignorar_id)
        return bool(self.database.consultar(sql + " LIMIT 1", tuple(params)))


class LeitorRepositoryMemoria:
    """Guarda os leitores na memória do servidor, no lugar do MySQL."""

    def __init__(self):
        self.leitores: list[Leitor] = []
        # Imita o AUTO_INCREMENT do MySQL: o id nunca é reaproveitado.
        self.proximo_id = 1

    def criar(self, leitor: Leitor) -> Leitor:
        """Guarda o leitor e devolve com o próximo id."""
        leitor = leitor.model_copy(update={"id_leitor": self.proximo_id})
        self.proximo_id += 1
        self.leitores.append(leitor)
        return leitor

    def listar(self, busca: str | None = None) -> list[Leitor]:
        """Filtra e ordena do mesmo jeito que o SQL do LeitorRepository."""
        leitores = self.leitores
        if busca:
            termo = sem_acento(busca)
            leitores = [leitor for leitor in leitores if termo in sem_acento(f"{leitor.nome} {leitor.email}")]
        return sorted(leitores, key=lambda leitor: (sem_acento(leitor.nome), leitor.id_leitor))

    def buscar_por_id(self, id_leitor: int) -> Leitor | None:
        """Devolve o leitor com esse id, ou None."""
        return next((leitor for leitor in self.leitores if leitor.id_leitor == id_leitor), None)

    def atualizar(self, leitor: Leitor) -> Leitor:
        """Troca o leitor guardado por esta versão."""
        self.leitores = [leitor if atual.id_leitor == leitor.id_leitor else atual for atual in self.leitores]
        return leitor

    def excluir(self, id_leitor: int) -> None:
        """Tira o leitor da lista."""
        self.leitores = [leitor for leitor in self.leitores if leitor.id_leitor != id_leitor]

    def existe_email(self, email: str, ignorar_id: int | None = None) -> bool:
        """Compara sem diferenciar maiúsculas, como o MySQL faz."""
        return any(
            sem_acento(leitor.email) == sem_acento(email) and leitor.id_leitor != ignorar_id
            for leitor in self.leitores
        )
