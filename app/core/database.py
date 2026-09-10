"""Conexão com o banco de dados MySQL.

A classe `Database` concentra tudo o que envolve o banco: abrir a conexão,
executar comandos e devolver os resultados já convertidos para tipos comuns
do Python. Nenhuma outra camada do projeto importa o driver diretamente.
"""

from config import config

try:
    import mysql.connector
except ImportError:  # driver ainda não instalado
    mysql = None


class ErroBanco(Exception):
    """Falha ao conectar ou ao executar um comando no banco."""


class Database:
    """Executa comandos SQL no MySQL."""

    def conectar(self):
        """Abre e devolve uma nova conexão com o MySQL."""
        if mysql is None:
            raise ErroBanco(
                "Driver do MySQL não instalado. "
                "Execute: pip install -r requirements.txt"
            )
        try:
            return mysql.connector.connect(
                host=config.DB_HOST,
                port=config.DB_PORT,
                user=config.DB_USER,
                password=config.DB_PASSWORD,
                database=config.DB_NAME,
            )
        except mysql.connector.Error as erro:
            raise ErroBanco(f"Não foi possível conectar ao MySQL: {erro}") from erro

    def consultar(self, sql, parametros=()):
        """Executa um SELECT e devolve uma lista de dicionários."""
        conexao = self.conectar()
        try:
            cursor = conexao.cursor(dictionary=True)
            cursor.execute(sql, parametros)
            return cursor.fetchall()
        except mysql.connector.Error as erro:
            raise ErroBanco(f"Erro ao consultar o banco: {erro}") from erro
        finally:
            conexao.close()

    def executar(self, sql, parametros=()):
        """Executa INSERT, UPDATE ou DELETE e devolve o id gerado."""
        conexao = self.conectar()
        try:
            cursor = conexao.cursor()
            cursor.execute(sql, parametros)
            conexao.commit()
            return cursor.lastrowid
        except mysql.connector.Error as erro:
            conexao.rollback()
            raise ErroBanco(f"Erro ao gravar no banco: {erro}") from erro
        finally:
            conexao.close()
