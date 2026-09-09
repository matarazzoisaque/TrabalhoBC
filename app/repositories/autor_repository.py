"""SQL relacionado a autores.

Consultas SQL pendentes — serão adicionadas junto com o schema (ddl.sql).
"""

from app.config.database import obter_conexao


class AutorRepository:
    def __init__(self):
        self.conexao = obter_conexao()
