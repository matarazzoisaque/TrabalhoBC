"""Acesso aos dados da tabela emprestimos.

Só SQL: monta o comando e os parâmetros e entrega para o Database executar.
Nenhuma regra de negócio, nenhuma mensagem para o usuário.

Registrar um empréstimo ou uma devolução mexe em duas tabelas (emprestimos e
exemplares). Os dois comandos vão numa transação só: ou gravam juntos, ou
nenhum grava.

EmprestimoRepositoryMemoria é a versão temporária, sem banco, com os mesmos
métodos.
"""

from datetime import date

from app.core.database import DADOS_MUDARAM, Database, ErroBanco
from app.models.emprestimo import SITUACAO_ATIVO, SITUACAO_DEVOLVIDO, Emprestimo
from app.models.exemplar import STATUS_DISPONIVEL, STATUS_EMPRESTADO
from app.repositories.exemplar_repository import ExemplarRepositoryMemoria
from app.repositories.leitor_repository import LeitorRepositoryMemoria
from app.repositories.livro_repository import escapar_like, sem_acento

# Os JOINs trazem o nome do leitor e o título do livro, para a tela não
# precisar juntar os dados.
SELECT_EMPRESTIMOS = (
    "SELECT em.id_emprestimo, em.id_leitor, em.id_exemplar, em.data_emprestimo, "
    "em.data_prevista_devolucao, em.data_devolucao, "
    "le.nome AS nome_leitor, ex.id_livro, li.titulo AS titulo_livro "
    "FROM emprestimos em "
    "JOIN leitores le ON le.id_leitor = em.id_leitor "
    "JOIN exemplares ex ON ex.id_exemplar = em.id_exemplar "
    "JOIN livros li ON li.id_livro = ex.id_livro"
)

# Situações aceitas no filtro. A chave vem da tela, mas o SQL só recebe
# estes trechos fixos: o texto do usuário nunca entra no WHERE.
SITUACOES = {
    SITUACAO_ATIVO: "em.data_devolucao IS NULL",
    SITUACAO_DEVOLVIDO: "em.data_devolucao IS NOT NULL",
}

ORDEM_PADRAO = "emprestimo-recente"

# Ordenações aceitas, pelo mesmo motivo: o ORDER BY só recebe estes valores.
ORDENACOES = {
    "emprestimo-recente": "em.data_emprestimo DESC, em.id_emprestimo DESC",
    "devolucao-proxima": "em.data_prevista_devolucao ASC, em.id_emprestimo ASC",
    "devolucao-distante": "em.data_prevista_devolucao DESC, em.id_emprestimo DESC",
}


class EmprestimoRepository:
    """Comandos SQL da tabela emprestimos."""

    def __init__(self, database: Database):
        self.database = database

    def listar(self, busca: str | None = None, situacao: str | None = None,
               ordem: str = ORDEM_PADRAO) -> list[Emprestimo]:
        """SELECT dos empréstimos, com busca, situação e ordenação opcionais.

        A busca procura no nome do leitor e no título do livro.
        """
        sql = f"{SELECT_EMPRESTIMOS} WHERE 1 = 1"
        params = []
        if busca:
            sql += " AND (le.nome LIKE %s OR li.titulo LIKE %s)"
            params += [f"%{escapar_like(busca)}%"] * 2
        if situacao in SITUACOES:
            sql += f" AND {SITUACOES[situacao]}"
        sql += f" ORDER BY {ORDENACOES.get(ordem, ORDENACOES[ORDEM_PADRAO])}"
        return [Emprestimo.model_construct(**linha) for linha in self.database.consultar(sql, tuple(params))]

    def buscar_por_id(self, id_emprestimo: int) -> Emprestimo | None:
        """SELECT pelo id, com leitor e livro. Devolve um Emprestimo ou None."""
        linhas = self.database.consultar(f"{SELECT_EMPRESTIMOS} WHERE em.id_emprestimo = %s", (id_emprestimo,))
        return Emprestimo.model_construct(**linhas[0]) if linhas else None

    def registrar(self, emprestimo: Emprestimo) -> Emprestimo:
        """INSERT do empréstimo e UPDATE do exemplar para EMPRESTADO, na mesma transação.

        O UPDATE só altera o exemplar se ele ainda estiver DISPONIVEL. Se outra
        pessoa emprestou antes, nada é gravado.
        """
        resultados = self.database.executar_transacao([
            (
                "INSERT INTO emprestimos "
                "(id_leitor, id_exemplar, data_emprestimo, data_prevista_devolucao, data_devolucao) "
                "VALUES (%s, %s, %s, %s, NULL)",
                (emprestimo.id_leitor, emprestimo.id_exemplar, emprestimo.data_emprestimo,
                 emprestimo.data_prevista_devolucao),
            ),
            (
                "UPDATE exemplares SET status = %s WHERE id_exemplar = %s AND status = %s",
                (STATUS_EMPRESTADO, emprestimo.id_exemplar, STATUS_DISPONIVEL),
            ),
        ])
        return emprestimo.model_copy(update={"id_emprestimo": resultados[0]})

    def registrar_devolucao(self, emprestimo: Emprestimo, data_devolucao: date) -> None:
        """UPDATE da data de devolução e do exemplar para DISPONIVEL, na mesma transação.

        Só grava se o empréstimo ainda estiver aberto e o exemplar emprestado.
        """
        self.database.executar_transacao([
            (
                "UPDATE emprestimos SET data_devolucao = %s WHERE id_emprestimo = %s AND data_devolucao IS NULL",
                (data_devolucao, emprestimo.id_emprestimo),
            ),
            (
                "UPDATE exemplares SET status = %s WHERE id_exemplar = %s AND status = %s",
                (STATUS_DISPONIVEL, emprestimo.id_exemplar, STATUS_EMPRESTADO),
            ),
        ])

    def existe_para_leitor(self, id_leitor: int) -> bool:
        """Diz se o leitor tem algum empréstimo registrado, ativo ou não."""
        return bool(self.database.consultar("SELECT 1 FROM emprestimos WHERE id_leitor = %s LIMIT 1", (id_leitor,)))

    def existe_para_exemplar(self, id_exemplar: int) -> bool:
        """Diz se o exemplar tem algum empréstimo registrado, ativo ou não."""
        return bool(self.database.consultar(
            "SELECT 1 FROM emprestimos WHERE id_exemplar = %s LIMIT 1", (id_exemplar,)
        ))


class EmprestimoRepositoryMemoria:
    """Guarda os empréstimos na memória do servidor, no lugar do MySQL.

    Recebe os repositórios de leitores e exemplares para imitar os JOINs e a
    transação que muda o status do exemplar.
    """

    def __init__(self, leitor_repository: LeitorRepositoryMemoria, exemplar_repository: ExemplarRepositoryMemoria):
        self.leitor_repository = leitor_repository
        self.exemplar_repository = exemplar_repository
        self.emprestimos: list[Emprestimo] = []
        # Imita o AUTO_INCREMENT do MySQL: o id nunca é reaproveitado.
        self.proximo_id = 1

    def _com_dados(self, emprestimo: Emprestimo) -> Emprestimo:
        """Imita os JOINs com leitores, exemplares e livros."""
        leitor = self.leitor_repository.buscar_por_id(emprestimo.id_leitor)
        exemplar = self.exemplar_repository.buscar_por_id(emprestimo.id_exemplar)
        return emprestimo.model_copy(update={
            "nome_leitor": leitor.nome if leitor else None,
            "id_livro": exemplar.id_livro if exemplar else None,
            "titulo_livro": exemplar.titulo_livro if exemplar else None,
        })

    # Mesmas ordenações do SQL: (chave de ordenação, decrescente?).
    ORDENACOES = {
        "emprestimo-recente": (lambda item: (item.data_emprestimo, item.id_emprestimo), True),
        "devolucao-proxima": (lambda item: (item.data_prevista_devolucao, item.id_emprestimo), False),
        "devolucao-distante": (lambda item: (item.data_prevista_devolucao, item.id_emprestimo), True),
    }

    def listar(self, busca: str | None = None, situacao: str | None = None,
               ordem: str = ORDEM_PADRAO) -> list[Emprestimo]:
        """Filtra e ordena do mesmo jeito que o SQL do EmprestimoRepository."""
        emprestimos = [self._com_dados(emprestimo) for emprestimo in self.emprestimos]
        if busca:
            termo = sem_acento(busca)
            emprestimos = [emprestimo for emprestimo in emprestimos
                           if termo in sem_acento(f"{emprestimo.nome_leitor or ''} {emprestimo.titulo_livro or ''}")]
        if situacao in SITUACOES:
            emprestimos = [emprestimo for emprestimo in emprestimos if emprestimo.situacao == situacao]
        chave, decrescente = self.ORDENACOES.get(ordem, self.ORDENACOES[ORDEM_PADRAO])
        return sorted(emprestimos, key=chave, reverse=decrescente)

    def buscar_por_id(self, id_emprestimo: int) -> Emprestimo | None:
        """Devolve o empréstimo com esse id, com leitor e livro, ou None."""
        emprestimo = next((item for item in self.emprestimos if item.id_emprestimo == id_emprestimo), None)
        return self._com_dados(emprestimo) if emprestimo else None

    def registrar(self, emprestimo: Emprestimo) -> Emprestimo:
        """Guarda o empréstimo e marca o exemplar como EMPRESTADO, como a transação faz."""
        exemplar = self.exemplar_repository.buscar_por_id(emprestimo.id_exemplar)
        if exemplar is None or exemplar.status != STATUS_DISPONIVEL:
            raise ErroBanco(DADOS_MUDARAM)

        novo = Emprestimo.model_construct(
            id_emprestimo=self.proximo_id,
            id_leitor=emprestimo.id_leitor,
            id_exemplar=emprestimo.id_exemplar,
            data_emprestimo=emprestimo.data_emprestimo,
            data_prevista_devolucao=emprestimo.data_prevista_devolucao,
            data_devolucao=None,
        )
        self.proximo_id += 1
        self.emprestimos.append(novo)
        self.exemplar_repository.atualizar(exemplar.model_copy(update={"status": STATUS_EMPRESTADO}))
        return novo

    def registrar_devolucao(self, emprestimo: Emprestimo, data_devolucao: date) -> None:
        """Grava a data de devolução e volta o exemplar para DISPONIVEL, como a transação faz."""
        guardado = next((item for item in self.emprestimos if item.id_emprestimo == emprestimo.id_emprestimo), None)
        exemplar = self.exemplar_repository.buscar_por_id(emprestimo.id_exemplar)
        if (guardado is None or guardado.data_devolucao is not None
                or exemplar is None or exemplar.status != STATUS_EMPRESTADO):
            raise ErroBanco(DADOS_MUDARAM)

        devolvido = guardado.model_copy(update={"data_devolucao": data_devolucao})
        self.emprestimos = [devolvido if item.id_emprestimo == guardado.id_emprestimo else item
                            for item in self.emprestimos]
        self.exemplar_repository.atualizar(exemplar.model_copy(update={"status": STATUS_DISPONIVEL}))

    def existe_para_leitor(self, id_leitor: int) -> bool:
        """Diz se o leitor tem algum empréstimo registrado, ativo ou não."""
        return any(emprestimo.id_leitor == id_leitor for emprestimo in self.emprestimos)

    def existe_para_exemplar(self, id_exemplar: int) -> bool:
        """Diz se o exemplar tem algum empréstimo registrado, ativo ou não."""
        return any(emprestimo.id_exemplar == id_exemplar for emprestimo in self.emprestimos)
