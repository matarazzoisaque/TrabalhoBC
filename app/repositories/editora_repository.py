"""SQL relacionado a editoras.

Consultas SQL pendentes — serão adicionadas junto com o schema (ddl.sql).
"""

from app.config.database import obter_conexao


class EditoraRepository:
    def __init__(self):
        self.conexao = obter_conexao()
