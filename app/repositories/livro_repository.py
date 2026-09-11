"""Acesso aos dados da tabela livros.

Só SQL: monta o comando e os parâmetros e entrega para o Database executar.
Nenhuma regra de negócio, nenhuma mensagem para o usuário.

LivroRepositoryMemoria é a versão temporária, sem banco, para testar
enquanto o MySQL não está instalado.
"""

from app.core.database import Database
from app.models.livro import Livro

ORDEM_PADRAO = "titulo-asc"

# Ordenações aceitas. A chave vem da tela, mas o SQL só recebe os valores
# desta lista: o texto enviado pelo usuário nunca entra no ORDER BY.
ORDENACOES = {
    "titulo-asc": "titulo ASC",
    "titulo-desc": "titulo DESC",
    "autor-asc": "autor ASC, titulo ASC",
    "autor-desc": "autor DESC, titulo ASC",
    "data-desc": "data_cadastro DESC, id_livro DESC",
    "data-asc": "data_cadastro ASC, id_livro ASC",
    "lancamento-desc": "ano_lancamento DESC, titulo ASC",
    "lancamento-asc": "ano_lancamento ASC, titulo ASC",
}

COLUNAS = "id_livro, titulo, autor, genero, ano_lancamento, resumo, data_cadastro"


class LivroRepository:
    """Comandos SQL da tabela livros."""

    def __init__(self, database: Database):
        self.database = database

    def criar(self, livro: Livro) -> Livro:
        """INSERT do livro. Devolve o livro já com o id gerado pelo banco."""
        sql = (
            "INSERT INTO livros (titulo, autor, genero, ano_lancamento, resumo, data_cadastro) "
            "VALUES (%s, %s, %s, %s, %s, %s)"
        )
        params = (livro.titulo, livro.autor, livro.genero, livro.ano_lancamento,
                  livro.resumo, livro.data_cadastro)
        id_gerado = self.database.executar(sql, params)
        return livro.model_copy(update={"id_livro": id_gerado})

    def listar(self, busca=None, autor=None, genero=None, ordem=ORDEM_PADRAO) -> list[Livro]:
        """SELECT dos livros, com filtros opcionais.

        O WHERE é montado por partes, só com os filtros preenchidos, e o texto
        do usuário vai sempre como parâmetro (%s), nunca dentro do SQL.
        """
        sql = f"SELECT {COLUNAS} FROM livros WHERE 1 = 1"
        params = []
        if busca:
            sql += " AND (titulo LIKE %s OR autor LIKE %s OR genero LIKE %s)"
            params += [f"%{busca}%"] * 3
        if autor:
            sql += " AND autor = %s"
            params.append(autor)
        if genero:
            sql += " AND genero = %s"
            params.append(genero)
        sql += f" ORDER BY {ORDENACOES.get(ordem, ORDENACOES[ORDEM_PADRAO])}"

        # Os dados vêm do banco e já foram validados quando foram gravados.
        return [Livro.model_construct(**linha) for linha in self.database.consultar(sql, tuple(params))]

    def opcoes_de_filtro(self) -> dict[str, list[str]]:
        """Autores e gêneros cadastrados, para preencher os filtros da tela."""
        autores = self.database.consultar("SELECT DISTINCT autor FROM livros ORDER BY autor")
        generos = self.database.consultar("SELECT DISTINCT genero FROM livros ORDER BY genero")
        return {
            "autores": [linha["autor"] for linha in autores],
            "generos": [linha["genero"] for linha in generos],
        }

    def existe_duplicado(self, titulo: str, autor: str) -> bool:
        """Diz se já existe um livro com o mesmo título e autor."""
        sql = "SELECT 1 FROM livros WHERE titulo = %s AND autor = %s LIMIT 1"
        return bool(self.database.consultar(sql, (titulo, autor)))

    def buscar_por_id(self, id):
        """SELECT pelo id. Devolve um Livro ou None."""
        raise NotImplementedError

    def atualizar(self, livro):
        """UPDATE pelo id. Devolve True se alguma linha foi alterada."""
        raise NotImplementedError

    def excluir(self, id):
        """Exclusão lógica: UPDATE ativo = FALSE pelo id."""
        raise NotImplementedError


class LivroRepositoryMemoria:
    """Guarda os livros na memória do servidor, no lugar do MySQL.

    Uso temporário: os livros somem quando o servidor reinicia. Tem os mesmos
    métodos do LivroRepository, então o LivroService funciona igual com os dois.
    """

    # Mesmas ordenações do SQL: (chave de ordenação, decrescente?).
    ORDENACOES = {
        "titulo-asc": (lambda livro: livro.titulo.lower(), False),
        "titulo-desc": (lambda livro: livro.titulo.lower(), True),
        "autor-asc": (lambda livro: livro.autor.lower(), False),
        "autor-desc": (lambda livro: livro.autor.lower(), True),
        "data-desc": (lambda livro: (livro.data_cadastro, livro.id_livro), True),
        "data-asc": (lambda livro: (livro.data_cadastro, livro.id_livro), False),
        "lancamento-desc": (lambda livro: livro.ano_lancamento, True),
        "lancamento-asc": (lambda livro: livro.ano_lancamento, False),
    }

    def __init__(self):
        self.livros: list[Livro] = []

    def criar(self, livro: Livro) -> Livro:
        """Guarda o livro e devolve com o próximo id."""
        livro = livro.model_copy(update={"id_livro": len(self.livros) + 1})
        self.livros.append(livro)
        return livro

    def listar(self, busca=None, autor=None, genero=None, ordem=ORDEM_PADRAO) -> list[Livro]:
        """Filtra e ordena do mesmo jeito que o SQL do LivroRepository."""
        livros = self.livros
        if busca:
            termo = busca.lower()
            livros = [livro for livro in livros
                      if termo in f"{livro.titulo} {livro.autor} {livro.genero}".lower()]
        if autor:
            livros = [livro for livro in livros if livro.autor.lower() == autor.lower()]
        if genero:
            livros = [livro for livro in livros if livro.genero.lower() == genero.lower()]

        chave, decrescente = self.ORDENACOES.get(ordem, self.ORDENACOES[ORDEM_PADRAO])
        livros = sorted(livros, key=lambda livro: livro.titulo.lower())  # desempate por título
        return sorted(livros, key=chave, reverse=decrescente)

    def opcoes_de_filtro(self) -> dict[str, list[str]]:
        """Autores e gêneros cadastrados, em ordem alfabética."""
        return {
            "autores": sorted({livro.autor for livro in self.livros}, key=str.lower),
            "generos": sorted({livro.genero for livro in self.livros}, key=str.lower),
        }

    def existe_duplicado(self, titulo: str, autor: str) -> bool:
        """Compara sem diferenciar maiúsculas, como o MySQL faz."""
        return any(
            livro.titulo.lower() == titulo.lower() and livro.autor.lower() == autor.lower()
            for livro in self.livros
        )
