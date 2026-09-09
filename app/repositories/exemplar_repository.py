"""SQL relacionado aos exemplares.

Consultas SQL pendentes — serão adicionadas junto com o schema (ddl.sql).
"""

from app.config.database import obter_conexao


class ExemplarRepository:
    def __init__(self):
        self.conexao = obter_conexao()
