"""Regras de negócio dos livros.

Fica entre o servidor HTTP e o repositório: valida o que chega do front-end
antes de deixar qualquer dado chegar ao banco.
"""

from datetime import date

from app.models.livro import Livro

ANO_MINIMO = 1450
TAMANHO_MAXIMO_TITULO = 200
TAMANHO_MAXIMO_AUTOR = 150


class ErroValidacao(Exception):
    """Os dados enviados pelo usuário não passaram na validação."""


class LivroService:
    """Valida e coordena as operações com livros."""

    def __init__(self, repositorio):
        self._repositorio = repositorio

    def listar(self):
        """Devolve todos os livros como lista de dicionários."""
        livros = self._repositorio.listar_todos()
        return [livro.para_dicionario() for livro in livros]

    def cadastrar(self, dados):
        """Valida os dados recebidos e grava um novo livro."""
        titulo = self._texto_obrigatorio(
            dados.get("titulo"), "título", TAMANHO_MAXIMO_TITULO
        )
        autor = self._texto_obrigatorio(
            dados.get("autor"), "autor", TAMANHO_MAXIMO_AUTOR
        )
        ano = self._ano_valido(dados.get("ano_publicacao"))

        livro = Livro(titulo=titulo, autor=autor, ano_publicacao=ano)
        return self._repositorio.inserir(livro).para_dicionario()

    @staticmethod
    def _texto_obrigatorio(valor, nome_campo, tamanho_maximo):
        """Garante que o campo veio preenchido e dentro do tamanho permitido."""
        texto = str(valor).strip() if valor is not None else ""
        if not texto:
            raise ErroValidacao(f"O campo {nome_campo} é obrigatório.")
        if len(texto) > tamanho_maximo:
            raise ErroValidacao(
                f"O campo {nome_campo} deve ter no máximo "
                f"{tamanho_maximo} caracteres."
            )
        return texto

    @staticmethod
    def _ano_valido(valor):
        """Garante que o ano de publicação é um número dentro de um intervalo real."""
        if valor is None or str(valor).strip() == "":
            raise ErroValidacao("O campo ano de publicação é obrigatório.")
        try:
            ano = int(valor)
        except (TypeError, ValueError):
            raise ErroValidacao(
                "O ano de publicação deve ser um número inteiro."
            ) from None

        ano_limite = date.today().year + 1
        if ano < ANO_MINIMO or ano > ano_limite:
            raise ErroValidacao(
                f"O ano de publicação deve estar entre {ANO_MINIMO} e {ano_limite}."
            )
        return ano
