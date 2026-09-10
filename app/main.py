"""Ponto de entrada do sistema.

Monta as peças do back-end (banco -> repositório -> service -> servidor) e
sobe o servidor HTTP local.

Execute a partir da raiz do projeto:

    python -m app.main
"""

from app.core.database import Database
from app.core.servidor import Servidor
from app.repositories.livro_repository import LivroRepository
from app.services.livro_service import LivroService
from config import config


def principal():
    """Monta a aplicação e inicia o servidor."""
    database = Database()
    repositorio = LivroRepository(database)
    servico = LivroService(repositorio)

    servidor = Servidor(
        host=config.SERVIDOR_HOST,
        porta=config.SERVIDOR_PORTA,
        livro_service=servico,
    )
    servidor.iniciar()


if __name__ == "__main__":
    principal()
