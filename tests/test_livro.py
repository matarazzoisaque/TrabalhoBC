"""Testes das validações de livro.

Usa apenas `unittest`, da biblioteca padrão. Um repositório falso substitui
o banco, então os testes rodam sem MySQL instalado.

Execute a partir da raiz do projeto:

    python -m unittest tests.test_livro
"""

import unittest
from datetime import date

from app.models.livro import Livro
from app.services.livro_service import ErroValidacao, LivroService


class RepositorioFalso:
    """Substitui o LivroRepository nos testes, guardando tudo em memória."""

    def __init__(self):
        self.livros = []

    def listar_todos(self):
        return list(self.livros)

    def inserir(self, livro):
        livro.id_livro = len(self.livros) + 1
        self.livros.append(livro)
        return livro


class TestLivro(unittest.TestCase):
    """Conversão do modelo entre objeto e dicionário."""

    def test_para_dicionario_devolve_todos_os_campos(self):
        livro = Livro("Dom Casmurro", "Machado de Assis", 1899, id_livro=7)
        self.assertEqual(
            livro.para_dicionario(),
            {
                "id_livro": 7,
                "titulo": "Dom Casmurro",
                "autor": "Machado de Assis",
                "ano_publicacao": 1899,
            },
        )

    def test_de_dicionario_reconstroi_o_livro(self):
        livro = Livro.de_dicionario(
            {
                "id_livro": 3,
                "titulo": "Vidas Secas",
                "autor": "Graciliano Ramos",
                "ano_publicacao": 1938,
            }
        )
        self.assertEqual(livro.id_livro, 3)
        self.assertEqual(livro.titulo, "Vidas Secas")


class TestLivroServiceValidacoes(unittest.TestCase):
    """Regras aplicadas antes de gravar um livro."""

    def setUp(self):
        self.repositorio = RepositorioFalso()
        self.service = LivroService(self.repositorio)

    def test_cadastra_livro_valido(self):
        salvo = self.service.cadastrar(
            {"titulo": "O Cortiço", "autor": "Aluísio Azevedo", "ano_publicacao": 1890}
        )
        self.assertEqual(salvo["id_livro"], 1)
        self.assertEqual(salvo["titulo"], "O Cortiço")
        self.assertEqual(len(self.repositorio.livros), 1)

    def test_remove_espacos_sobrando(self):
        salvo = self.service.cadastrar(
            {"titulo": "  Vidas Secas  ", "autor": " Graciliano Ramos ", "ano_publicacao": "1938"}
        )
        self.assertEqual(salvo["titulo"], "Vidas Secas")
        self.assertEqual(salvo["autor"], "Graciliano Ramos")

    def test_ano_em_texto_vira_numero(self):
        salvo = self.service.cadastrar(
            {"titulo": "Iracema", "autor": "José de Alencar", "ano_publicacao": "1865"}
        )
        self.assertEqual(salvo["ano_publicacao"], 1865)

    def test_titulo_vazio_e_recusado(self):
        with self.assertRaises(ErroValidacao):
            self.service.cadastrar(
                {"titulo": "   ", "autor": "Machado de Assis", "ano_publicacao": 1899}
            )

    def test_autor_ausente_e_recusado(self):
        with self.assertRaises(ErroValidacao):
            self.service.cadastrar({"titulo": "Dom Casmurro", "ano_publicacao": 1899})

    def test_titulo_longo_demais_e_recusado(self):
        with self.assertRaises(ErroValidacao):
            self.service.cadastrar(
                {"titulo": "A" * 201, "autor": "Autor", "ano_publicacao": 1899}
            )

    def test_ano_nao_numerico_e_recusado(self):
        with self.assertRaises(ErroValidacao):
            self.service.cadastrar(
                {"titulo": "Dom Casmurro", "autor": "Machado de Assis", "ano_publicacao": "mil"}
            )

    def test_ano_antigo_demais_e_recusado(self):
        with self.assertRaises(ErroValidacao):
            self.service.cadastrar(
                {"titulo": "Livro antigo", "autor": "Autor", "ano_publicacao": 1000}
            )

    def test_ano_no_futuro_e_recusado(self):
        with self.assertRaises(ErroValidacao):
            self.service.cadastrar(
                {"titulo": "Livro futuro", "autor": "Autor", "ano_publicacao": date.today().year + 5}
            )

    def test_listar_devolve_dicionarios(self):
        self.service.cadastrar(
            {"titulo": "Dom Casmurro", "autor": "Machado de Assis", "ano_publicacao": 1899}
        )
        listagem = self.service.listar()
        self.assertEqual(len(listagem), 1)
        self.assertEqual(listagem[0]["titulo"], "Dom Casmurro")


if __name__ == "__main__":
    unittest.main()
