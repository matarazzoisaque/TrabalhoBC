"""Configuração e abertura da conexão com o banco SQLite."""

import sqlite3
from pathlib import Path

CAMINHO_BANCO = Path(__file__).resolve().parent.parent.parent / "database" / "book_book.db"


def obter_conexao() -> sqlite3.Connection:
    conexao = sqlite3.connect(CAMINHO_BANCO)
    conexao.row_factory = sqlite3.Row
    conexao.execute("PRAGMA foreign_keys = ON")
    return conexao
