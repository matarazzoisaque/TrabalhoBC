"""Modelo que representa um livro do acervo."""


class Livro:
    """Um livro cadastrado na biblioteca."""

    def __init__(self, titulo, autor, ano_publicacao, id_livro=None):
        self.id_livro = id_livro
        self.titulo = titulo
        self.autor = autor
        self.ano_publicacao = ano_publicacao

    @classmethod
    def de_dicionario(cls, dados):
        """Cria um Livro a partir de um dicionário (JSON ou linha do banco)."""
        return cls(
            id_livro=dados.get("id_livro"),
            titulo=dados.get("titulo"),
            autor=dados.get("autor"),
            ano_publicacao=dados.get("ano_publicacao"),
        )

    def para_dicionario(self):
        """Converte o Livro em dicionário, pronto para virar JSON."""
        return {
            "id_livro": self.id_livro,
            "titulo": self.titulo,
            "autor": self.autor,
            "ano_publicacao": self.ano_publicacao,
        }

    def __repr__(self):
        return f"Livro(id_livro={self.id_livro!r}, titulo={self.titulo!r})"
