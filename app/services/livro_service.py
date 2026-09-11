"""Regras de negócio dos livros.

O service decide se o pedido deve acontecer; o repositório só executa.
Operações que podem ser recusadas devolvem uma tupla (ok, dados_ou_erros),
que o Servidor traduz em status HTTP.
"""

from datetime import date

from pydantic import ValidationError

from app.models.livro import Livro
from app.repositories.livro_repository import LivroRepository

# Filtros que a tela pode enviar na listagem.
FILTROS = ("busca", "autor", "genero", "ordem")


class LivroService:
    """Valida e coordena as operações com livros."""

    def __init__(self, repository: LivroRepository):
        self.repository = repository

    def cadastrar(self, dados: dict) -> tuple[bool, dict | list[str]]:
        """Valida, checa duplicata e cria o livro.

        O id e a data de cadastro são definidos pelo servidor, nunca pela tela.
        """
        try:
            livro = Livro.model_validate(dados)
        except ValidationError as erro:
            return False, Livro.mensagens_de_erro(erro)

        if self.repository.existe_duplicado(livro.titulo, livro.autor):
            return False, ["Já existe um livro com esse título e autor."]

        livro = livro.model_copy(update={"id_livro": None, "data_cadastro": date.today()})
        return True, self.repository.criar(livro).model_dump(mode="json")

    def listar(self, filtros: dict) -> list[dict]:
        """Remove os filtros vazios ou desconhecidos e repassa ao repositório."""
        filtros = {
            chave: valor.strip()
            for chave, valor in filtros.items()
            if chave in FILTROS and valor.strip()
        }
        return [livro.model_dump(mode="json") for livro in self.repository.listar(**filtros)]

    def opcoes_de_filtro(self) -> dict[str, list[str]]:
        """Autores e gêneros disponíveis para os filtros da tela."""
        return self.repository.opcoes_de_filtro()

    def detalhar(self, id):
        """Busca o livro e devolve erro se ele não existir."""
        raise NotImplementedError

    def editar(self, id, dados):
        """Confere se existe, valida, checa duplicata (com ignorar_id) e atualiza."""
        raise NotImplementedError

    def remover(self, id):
        """Confere se existe e exclui (exclusão lógica)."""
        raise NotImplementedError
