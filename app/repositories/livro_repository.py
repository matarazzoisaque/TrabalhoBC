"""Acesso aos dados de livros.

Esta camada é a única que conhece SQL. Ela recebe e devolve objetos `Livro`,
isolando o restante do sistema da estrutura das tabelas.
"""

from app.models.livro import Livro


class LivroRepository:
    """Comandos SQL da tabela `livros`."""

    def __init__(self, database):
        self._database = database

    def listar_todos(self):
        """Devolve todos os livros cadastrados, em ordem alfabética."""
        sql = (
            "SELECT id_livro, titulo, autor, ano_publicacao "
            "FROM livros ORDER BY titulo"
        )
        linhas = self._database.consultar(sql)
        return [Livro.de_dicionario(linha) for linha in linhas]

    def inserir(self, livro):
        """Grava um novo livro e devolve o objeto já com o id gerado."""
        sql = (
            "INSERT INTO livros (titulo, autor, ano_publicacao) "
            "VALUES (%s, %s, %s)"
        )
        parametros = (livro.titulo, livro.autor, livro.ano_publicacao)
        livro.id_livro = self._database.executar(sql, parametros)
        return livro
