"""Consultas SQL para administradores e login.

Consultas SQL pendentes — serão adicionadas junto com o schema (ddl.sql).
"""

from app.config.database import obter_conexao


class AdministradorRepository:
    def __init__(self):
        self.conexao = obter_conexao()
