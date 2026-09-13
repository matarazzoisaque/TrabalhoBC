"""Conexão com o banco de dados MySQL.

Database é a única classe do projeto que importa o mysql.connector. Recebe
SQL pronto e parâmetros, executa e devolve o resultado. Não sabe o que é um
livro.
"""

import mysql.connector

# Mensagem de quando um comando da transação não encontra a linha esperada.
DADOS_MUDARAM = "A operação não foi concluída porque os dados mudaram. Atualize a página e tente de novo."


class ErroBanco(Exception):
    """Falha ao conectar ou ao executar um comando no MySQL."""


class Database:
    """Encapsula a conexão com o MySQL."""

    def __init__(self, host: str, usuario: str, senha: str, banco: str):
        self.host = host
        self.usuario = usuario
        self.senha = senha
        self.banco = banco
        self.conexao = None

    def conectar(self) -> None:
        """Abre a conexão e guarda em self.conexao."""
        try:
            self.conexao = mysql.connector.connect(
                host=self.host, user=self.usuario, password=self.senha, database=self.banco
            )
        except mysql.connector.Error as erro:
            raise ErroBanco(f"Não foi possível conectar ao MySQL: {erro}") from erro

    def consultar(self, sql: str, params: tuple = ()) -> list[dict]:
        """Executa um SELECT e devolve as linhas como dicionários."""
        self.conectar()
        try:
            cursor = self.conexao.cursor(dictionary=True)
            cursor.execute(sql, params)
            return cursor.fetchall()
        except mysql.connector.Error as erro:
            raise ErroBanco(f"Erro ao consultar o banco: {erro}") from erro
        finally:
            self.fechar()

    def executar(self, sql: str, params: tuple = ()) -> int:
        """Executa INSERT, UPDATE ou DELETE e faz commit.

        Devolve o id gerado (no INSERT) ou o número de linhas afetadas.
        """
        self.conectar()
        try:
            cursor = self.conexao.cursor()
            cursor.execute(sql, params)
            self.conexao.commit()
            return cursor.lastrowid or cursor.rowcount
        except mysql.connector.Error as erro:
            self.conexao.rollback()
            raise ErroBanco(f"Erro ao gravar no banco: {erro}") from erro
        finally:
            self.fechar()

    def executar_transacao(self, comandos: list[tuple[str, tuple]]) -> list[int]:
        """Executa vários comandos numa transação só: ou todos gravam, ou nenhum.

        Cada comando precisa alterar pelo menos uma linha. Se algum não alterar
        (por exemplo, o exemplar já foi emprestado por outra pessoa), tudo é
        desfeito com rollback. Devolve, para cada comando, o id gerado (no
        INSERT) ou o número de linhas afetadas.
        """
        self.conectar()
        try:
            cursor = self.conexao.cursor()
            resultados = []
            for sql, params in comandos:
                cursor.execute(sql, params)
                if cursor.rowcount < 1:
                    raise ErroBanco(DADOS_MUDARAM)
                resultados.append(cursor.lastrowid or cursor.rowcount)
            self.conexao.commit()
            return resultados
        except mysql.connector.Error as erro:
            self.conexao.rollback()
            raise ErroBanco(f"Erro ao gravar no banco: {erro}") from erro
        except ErroBanco:
            self.conexao.rollback()
            raise
        finally:
            self.fechar()

    def fechar(self) -> None:
        """Fecha a conexão aberta, se houver."""
        if self.conexao is not None:
            self.conexao.close()
            self.conexao = None
