"""Acesso aos dados da tabela livros.

Só SQL: monta o comando e os parâmetros e entrega para o Database executar.
Nenhuma regra de negócio, nenhuma mensagem para o usuário.

LivroRepositoryMemoria é a versão temporária, sem banco, para testar
enquanto o MySQL não está instalado.
"""

import unicodedata

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


def escapar_like(texto: str) -> str:
    """Deixa %, _ e a barra invertida literais dentro de um LIKE.

    Sem isso, quem digitasse "100%" na busca estaria usando curinga do SQL.
    """
    return texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def sem_acento(texto: str) -> str:
    """Texto sem acento e em minúsculas.

    Serve para o repositório em memória comparar do mesmo jeito que o MySQL
    com a collation utf8mb4_unicode_ci, que ignora acentos e maiúsculas.
    """
    decomposto = unicodedata.normalize("NFD", texto)
    return "".join(letra for letra in decomposto
                   if unicodedata.category(letra) != "Mn").lower()

# Períodos aceitos no filtro de ano de lançamento: chave da tela -> (de, até).
PERIODOS = {
    "ate-1899": (1450, 1899),
    "1900-1949": (1900, 1949),
    "1950-1999": (1950, 1999),
    "2000-2009": (2000, 2009),
    "2010-2019": (2010, 2019),
    "2020-hoje": (2020, 2100),
}


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

    def listar(self, busca=None, genero=None, periodo=None, ordem=ORDEM_PADRAO) -> list[Livro]:
        """SELECT dos livros, com filtros opcionais.

        O WHERE é montado por partes, só com os filtros preenchidos, e o texto
        do usuário vai sempre como parâmetro (%s), nunca dentro do SQL.
        """
        sql = f"SELECT {COLUNAS} FROM livros WHERE 1 = 1"
        params = []
        if busca:
            sql += " AND (titulo LIKE %s OR autor LIKE %s OR genero LIKE %s)"
            params += [f"%{escapar_like(busca)}%"] * 3
        if genero:
            sql += " AND genero = %s"
            params.append(genero)
        if periodo in PERIODOS:
            de, ate = PERIODOS[periodo]
            sql += " AND ano_lancamento BETWEEN %s AND %s"
            params += [de, ate]
        sql += f" ORDER BY {ORDENACOES.get(ordem, ORDENACOES[ORDEM_PADRAO])}"

        # Os dados vêm do banco e já foram validados quando foram gravados.
        return [Livro.model_construct(**linha) for linha in self.database.consultar(sql, tuple(params))]

    def opcoes_de_filtro(self) -> dict[str, list[str]]:
        """Gêneros cadastrados, para preencher o filtro da tela."""
        generos = self.database.consultar("SELECT DISTINCT genero FROM livros ORDER BY genero")
        return {"generos": [linha["genero"] for linha in generos]}

    def existe_duplicado(self, titulo: str, autor: str, ignorar_id: int | None = None) -> bool:
        """Diz se já existe um livro com o mesmo título e autor.

        Na edição, ignorar_id recebe o id do próprio livro, para ele não ser
        acusado de duplicata de si mesmo.
        """
        sql = "SELECT 1 FROM livros WHERE titulo = %s AND autor = %s"
        params = [titulo, autor]
        if ignorar_id is not None:
            sql += " AND id_livro <> %s"
            params.append(ignorar_id)
        return bool(self.database.consultar(sql + " LIMIT 1", tuple(params)))

    def buscar_por_id(self, id_livro: int) -> Livro | None:
        """SELECT pelo id. Devolve um Livro ou None."""
        linhas = self.database.consultar(f"SELECT {COLUNAS} FROM livros WHERE id_livro = %s", (id_livro,))
        return Livro.model_construct(**linhas[0]) if linhas else None

    def atualizar(self, livro: Livro) -> Livro:
        """UPDATE pelo id. A data de cadastro não muda na edição."""
        sql = (
            "UPDATE livros SET titulo = %s, autor = %s, genero = %s, "
            "ano_lancamento = %s, resumo = %s WHERE id_livro = %s"
        )
        params = (livro.titulo, livro.autor, livro.genero, livro.ano_lancamento,
                  livro.resumo, livro.id_livro)
        self.database.executar(sql, params)
        return livro

    def excluir(self, id_livro: int) -> None:
        """DELETE pelo id."""
        self.database.executar("DELETE FROM livros WHERE id_livro = %s", (id_livro,))


class LivroRepositoryMemoria:
    """Guarda os livros na memória do servidor, no lugar do MySQL.

    Uso temporário: os livros somem quando o servidor reinicia. Tem os mesmos
    métodos do LivroRepository, então o LivroService funciona igual com os dois.
    """

    # Mesmas ordenações do SQL: (chave de ordenação, decrescente?).
    ORDENACOES = {
        "titulo-asc": (lambda livro: sem_acento(livro.titulo), False),
        "titulo-desc": (lambda livro: sem_acento(livro.titulo), True),
        "autor-asc": (lambda livro: sem_acento(livro.autor), False),
        "autor-desc": (lambda livro: sem_acento(livro.autor), True),
        "data-desc": (lambda livro: (livro.data_cadastro, livro.id_livro), True),
        "data-asc": (lambda livro: (livro.data_cadastro, livro.id_livro), False),
        "lancamento-desc": (lambda livro: livro.ano_lancamento, True),
        "lancamento-asc": (lambda livro: livro.ano_lancamento, False),
    }

    def __init__(self):
        self.livros: list[Livro] = []
        # Imita o AUTO_INCREMENT do MySQL: o id nunca é reaproveitado.
        self.proximo_id = 1

    def criar(self, livro: Livro) -> Livro:
        """Guarda o livro e devolve com o próximo id."""
        livro = livro.model_copy(update={"id_livro": self.proximo_id})
        self.proximo_id += 1
        self.livros.append(livro)
        return livro

    def listar(self, busca=None, genero=None, periodo=None, ordem=ORDEM_PADRAO) -> list[Livro]:
        """Filtra e ordena do mesmo jeito que o SQL do LivroRepository."""
        livros = self.livros
        if busca:
            termo = sem_acento(busca)
            livros = [livro for livro in livros
                      if termo in sem_acento(f"{livro.titulo} {livro.autor} {livro.genero}")]
        if genero:
            livros = [livro for livro in livros if sem_acento(livro.genero) == sem_acento(genero)]
        if periodo in PERIODOS:
            de, ate = PERIODOS[periodo]
            livros = [livro for livro in livros if de <= livro.ano_lancamento <= ate]

        chave, decrescente = self.ORDENACOES.get(ordem, self.ORDENACOES[ORDEM_PADRAO])
        livros = sorted(livros, key=lambda livro: sem_acento(livro.titulo))  # desempate por título
        return sorted(livros, key=chave, reverse=decrescente)

    def opcoes_de_filtro(self) -> dict[str, list[str]]:
        """Gêneros cadastrados, em ordem alfabética."""
        return {"generos": sorted({livro.genero for livro in self.livros}, key=sem_acento)}

    def existe_duplicado(self, titulo: str, autor: str, ignorar_id: int | None = None) -> bool:
        """Compara sem diferenciar maiúsculas, como o MySQL faz."""
        return any(
            sem_acento(livro.titulo) == sem_acento(titulo)
            and sem_acento(livro.autor) == sem_acento(autor)
            and livro.id_livro != ignorar_id
            for livro in self.livros
        )

    def buscar_por_id(self, id_livro: int) -> Livro | None:
        """Devolve o livro com esse id, ou None."""
        return next((livro for livro in self.livros if livro.id_livro == id_livro), None)

    def atualizar(self, livro: Livro) -> Livro:
        """Troca o livro guardado por esta versão."""
        for indice, atual in enumerate(self.livros):
            if atual.id_livro == livro.id_livro:
                self.livros[indice] = livro
                break
        return livro

    def excluir(self, id_livro: int) -> None:
        """Tira o livro da lista."""
        self.livros = [livro for livro in self.livros if livro.id_livro != id_livro]
