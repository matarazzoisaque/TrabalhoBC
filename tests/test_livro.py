"""Testes do cadastro e da listagem de livros.

O LivroRepositoryMemoria substitui o banco, então os testes rodam sem MySQL.

Execute a partir da raiz do projeto:

    python -m unittest tests.test_livro
"""

import unittest
from datetime import date

from pydantic import ValidationError

from app.models.livro import Livro
from app.repositories.livro_repository import LivroRepository, LivroRepositoryMemoria
from app.services.livro_service import LivroService

VALIDO = {
    "titulo": "Vidas Secas",
    "autor": "Graciliano Ramos",
    "genero": "Regionalismo",
    "ano_lancamento": 1938,
    "resumo": "Uma família de retirantes foge da seca pelo sertão.",
}

ACERVO = [
    {"titulo": "Dom Casmurro", "autor": "Machado de Assis", "genero": "Realismo",
     "ano_lancamento": 1899, "resumo": "Bentinho relembra o casamento com Capitu."},
    {"titulo": "Memórias Póstumas de Brás Cubas", "autor": "Machado de Assis", "genero": "Realismo",
     "ano_lancamento": 1881, "resumo": "Um defunto autor conta a própria vida."},
    VALIDO,
]


class TestLivro(unittest.TestCase):
    """Validações feitas pelo pydantic ao criar um Livro."""

    def erros(self, dados):
        with self.assertRaises(ValidationError) as contexto:
            Livro.model_validate(dados)
        return Livro.mensagens_de_erro(contexto.exception)

    def test_livro_valido(self):
        livro = Livro.model_validate(VALIDO)
        self.assertEqual(livro.genero, "Regionalismo")
        self.assertEqual(livro.data_cadastro, date.today())

    def test_remove_espacos_e_converte_ano(self):
        livro = Livro.model_validate({**VALIDO, "titulo": "  Vidas Secas  ", "ano_lancamento": "1938"})
        self.assertEqual(livro.titulo, "Vidas Secas")
        self.assertEqual(livro.ano_lancamento, 1938)

    def test_titulo_so_com_espacos(self):
        self.assertEqual(self.erros({**VALIDO, "titulo": "   "}), ["O campo título é obrigatório."])

    def test_campo_ausente(self):
        dados = {chave: valor for chave, valor in VALIDO.items() if chave != "autor"}
        self.assertEqual(self.erros(dados), ["O campo autor é obrigatório."])

    def test_genero_vazio(self):
        self.assertEqual(self.erros({**VALIDO, "genero": ""}), ["O campo gênero é obrigatório."])

    def test_ano_vazio(self):
        self.assertEqual(
            self.erros({**VALIDO, "ano_lancamento": ""}),
            ["O campo ano de lançamento é obrigatório."],
        )

    def test_ano_nao_numerico(self):
        self.assertEqual(
            self.erros({**VALIDO, "ano_lancamento": "mil"}),
            ["O campo ano de lançamento deve ser um número inteiro."],
        )

    def test_ano_fora_do_intervalo(self):
        for ano in (1000, date.today().year + 1):
            with self.subTest(ano=ano):
                self.assertIn("deve estar entre 1450", self.erros({**VALIDO, "ano_lancamento": ano})[0])

    def test_resumo_vazio(self):
        self.assertEqual(self.erros({**VALIDO, "resumo": ""}), ["O campo resumo é obrigatório."])

    def test_resumo_acima_de_1000(self):
        self.assertEqual(
            self.erros({**VALIDO, "resumo": "a" * 1001}),
            ["O campo resumo deve ter no máximo 1000 caracteres."],
        )

    def test_resumo_com_1000_passa(self):
        self.assertEqual(len(Livro.model_validate({**VALIDO, "resumo": "a" * 1000}).resumo), 1000)


class TestCadastro(unittest.TestCase):
    """Cadastro passando pelo service."""

    def setUp(self):
        self.service = LivroService(LivroRepositoryMemoria())

    def test_cadastrar_devolve_livro_com_id_e_data(self):
        ok, livro = self.service.cadastrar(VALIDO)
        self.assertTrue(ok)
        self.assertEqual(livro["id_livro"], 1)
        self.assertEqual(livro["data_cadastro"], date.today().isoformat())

    def test_id_e_data_de_cadastro_sao_do_servidor(self):
        ok, livro = self.service.cadastrar({**VALIDO, "id_livro": 99, "data_cadastro": "2000-01-01"})
        self.assertTrue(ok)
        self.assertEqual(livro["id_livro"], 1)
        self.assertEqual(livro["data_cadastro"], date.today().isoformat())

    def test_cadastrar_vazio_devolve_um_erro_por_campo(self):
        ok, erros = self.service.cadastrar({})
        self.assertFalse(ok)
        self.assertEqual(len(erros), 5)

    def test_cadastrar_duplicado_e_recusado(self):
        self.service.cadastrar(VALIDO)
        ok, erros = self.service.cadastrar(VALIDO)
        self.assertFalse(ok)
        self.assertEqual(erros, ["Já existe um livro com esse título e autor."])

    def test_duplicado_ignora_maiusculas(self):
        self.service.cadastrar(VALIDO)
        ok, _ = self.service.cadastrar({**VALIDO, "titulo": "VIDAS SECAS"})
        self.assertFalse(ok)


class TestListagem(unittest.TestCase):
    """Filtros e ordenação feitos no back-end."""

    def setUp(self):
        self.service = LivroService(LivroRepositoryMemoria())
        for dados in ACERVO:
            self.service.cadastrar(dados)

    def titulos(self, **filtros):
        return [livro["titulo"] for livro in self.service.listar(filtros)]

    def test_sem_filtro_ordena_por_titulo(self):
        self.assertEqual(self.titulos(), ["Dom Casmurro", "Memórias Póstumas de Brás Cubas", "Vidas Secas"])

    def test_busca_por_titulo_autor_ou_genero(self):
        self.assertEqual(self.titulos(busca="casmurro"), ["Dom Casmurro"])
        self.assertEqual(self.titulos(busca="graciliano"), ["Vidas Secas"])
        self.assertEqual(self.titulos(busca="regional"), ["Vidas Secas"])

    def test_filtra_por_autor_e_genero(self):
        self.assertEqual(len(self.titulos(autor="Machado de Assis")), 2)
        self.assertEqual(self.titulos(genero="Regionalismo"), ["Vidas Secas"])

    def test_ordena_por_ano_de_lancamento(self):
        self.assertEqual(
            self.titulos(ordem="lancamento-desc"),
            ["Vidas Secas", "Dom Casmurro", "Memórias Póstumas de Brás Cubas"],
        )

    def test_filtros_vazios_ou_desconhecidos_sao_ignorados(self):
        self.assertEqual(len(self.titulos(busca="   ", xyz="a", ordem="inexistente")), 3)

    def test_opcoes_de_filtro(self):
        self.assertEqual(
            self.service.opcoes_de_filtro(),
            {"autores": ["Graciliano Ramos", "Machado de Assis"], "generos": ["Realismo", "Regionalismo"]},
        )


class DatabaseQueGuardaSQL:
    """Guarda o SQL que o LivroRepository mandaria ao MySQL."""

    def __init__(self):
        self.sql = None
        self.params = None

    def consultar(self, sql, params=()):
        self.sql, self.params = sql, params
        return []


class TestSQLDoRepositorio(unittest.TestCase):
    """O texto do usuário nunca entra no SQL: vai sempre como parâmetro."""

    def setUp(self):
        self.database = DatabaseQueGuardaSQL()
        self.repositorio = LivroRepository(self.database)

    def test_busca_vai_como_parametro(self):
        self.repositorio.listar(busca="x' OR '1'='1")
        self.assertNotIn("'1'='1", self.database.sql)
        self.assertIn("%x' OR '1'='1%", self.database.params)

    def test_ordem_desconhecida_usa_a_padrao(self):
        self.repositorio.listar(ordem="titulo; DROP TABLE livros")
        self.assertTrue(self.database.sql.endswith("ORDER BY titulo ASC"))


if __name__ == "__main__":
    unittest.main()
