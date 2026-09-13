"""Regras de negócio dos livros.

O service decide se o pedido deve acontecer; o repositório só executa.
Operações que podem ser recusadas devolvem uma tupla (ok, dados_ou_erros),
que o Servidor traduz em status HTTP.
"""

from datetime import date

from pydantic import ValidationError

from app.models.livro import Livro
from app.repositories.exemplar_repository import ExemplarRepository
from app.repositories.livro_repository import LivroRepository

# Filtros que a tela pode enviar na listagem.
FILTROS = ("busca", "genero", "periodo", "ordem")

# Mensagem usada pelo Servidor para responder 404 em vez de 400.
NAO_ENCONTRADO = "Livro não encontrado."


class LivroService:
    """Valida e coordena as operações com livros."""

    def __init__(self, repository: LivroRepository, exemplar_repository: ExemplarRepository):
        self.repository = repository
        self.exemplar_repository = exemplar_repository

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
        """Gêneros disponíveis para o filtro da tela."""
        return self.repository.opcoes_de_filtro()

    def detalhar(self, id):
        """Busca o livro e devolve erro se ele não existir."""
        raise NotImplementedError

    def editar(self, id_livro: int, dados: dict) -> tuple[bool, dict | list[str]]:
        """Confere se existe, valida, checa duplicata e atualiza.

        O id e a data de cadastro do livro original são mantidos: a edição
        muda só os dados do livro.
        """
        atual = self.repository.buscar_por_id(id_livro)
        if atual is None:
            return False, [NAO_ENCONTRADO]

        try:
            livro = Livro.model_validate(dados)
        except ValidationError as erro:
            return False, Livro.mensagens_de_erro(erro)

        if self.repository.existe_duplicado(livro.titulo, livro.autor, ignorar_id=id_livro):
            return False, ["Já existe um livro com esse título e autor."]

        livro = livro.model_copy(update={"id_livro": id_livro, "data_cadastro": atual.data_cadastro})
        return True, self.repository.atualizar(livro).model_dump(mode="json")

    def remover(self, id_livro: int) -> tuple[bool, dict | list[str]]:
        """Confere se o livro existe e se não tem exemplares, e o exclui.

        Livro com exemplares não pode sair: a chave estrangeira de exemplares
        impediria no banco. Devolve o livro excluído.
        """
        livro = self.repository.buscar_por_id(id_livro)
        if livro is None:
            return False, [NAO_ENCONTRADO]

        if self.exemplar_repository.existe_para_livro(id_livro):
            return False, ["Este livro tem exemplares cadastrados e não pode ser excluído."]

        self.repository.excluir(id_livro)
        return True, livro.model_dump(mode="json")
