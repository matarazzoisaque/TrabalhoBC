"""SQL relacionado a categorias.

Consultas SQL pendentes — serão adicionadas junto com o schema (ddl.sql).
"""

from app.config.database import obter_conexao


class CategoriaRepository:
    def __init__(self):
        self.conexao = obter_conexao()
