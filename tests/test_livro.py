"""Testes do cadastro e da listagem de livros.

O LivroRepositoryMemoria substitui o banco, então os testes rodam sem MySQL.

Execute a partir da raiz do projeto:

    python -m unittest tests.test_livro
"""

import unittest
from datetime import date

from pydantic import ValidationError

from app.models.livro import Livro
from app.repositories.exemplar_repository import ExemplarRepositoryMemoria
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


def novo_livro_service():
    """LivroService com os repositórios em memória."""
    livros = LivroRepositoryMemoria()
    return LivroService(livros, ExemplarRepositoryMemoria(livros))


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
        self.service = novo_livro_service()

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

    def test_duplicado_ignora_acento(self):
        self.service.cadastrar({**VALIDO, "titulo": "Memórias Póstumas"})
        ok, _ = self.service.cadastrar({**VALIDO, "titulo": "Memorias Postumas"})
        self.assertFalse(ok)


class TestListagem(unittest.TestCase):
    """Filtros e ordenação feitos no back-end."""

    def setUp(self):
        self.service = novo_livro_service()
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

    def test_filtra_por_genero(self):
        self.assertEqual(self.titulos(genero="Regionalismo"), ["Vidas Secas"])
        self.assertEqual(len(self.titulos(genero="Realismo")), 2)

    def test_filtra_por_periodo_de_lancamento(self):
        self.assertEqual(self.titulos(periodo="1900-1949"), ["Vidas Secas"])
        self.assertEqual(len(self.titulos(periodo="ate-1899")), 2)
        self.assertEqual(self.titulos(periodo="2020-hoje"), [])

    def test_busca_ignora_acento_e_maiusculas(self):
        self.assertEqual(self.titulos(busca="memorias"), ["Memórias Póstumas de Brás Cubas"])
        self.assertEqual(self.titulos(busca="GRACILIANO"), ["Vidas Secas"])

    def test_busca_com_curinga_e_texto_comum(self):
        self.assertEqual(self.titulos(busca="%"), [])
        self.assertEqual(self.titulos(busca="_"), [])

    def test_periodo_desconhecido_e_ignorado(self):
        self.assertEqual(len(self.titulos(periodo="qualquer-coisa")), 3)

    def test_genero_e_periodo_juntos(self):
        self.assertEqual(self.titulos(genero="Realismo", periodo="1900-1949"), [])
        self.assertEqual(self.titulos(genero="Regionalismo", periodo="1900-1949"), ["Vidas Secas"])

    def test_ordena_por_ano_de_lancamento(self):
        self.assertEqual(
            self.titulos(ordem="lancamento-desc"),
            ["Vidas Secas", "Dom Casmurro", "Memórias Póstumas de Brás Cubas"],
        )

    def test_filtros_vazios_ou_desconhecidos_sao_ignorados(self):
        self.assertEqual(len(self.titulos(busca="   ", xyz="a", ordem="inexistente")), 3)

    def test_opcoes_de_filtro(self):
        self.assertEqual(self.service.opcoes_de_filtro(), {"generos": ["Realismo", "Regionalismo"]})


class DatabaseQueGuardaSQL:
    """Guarda o SQL que o LivroRepository mandaria ao MySQL."""

    def __init__(self):
        self.sql = None
        self.params = None

    def consultar(self, sql, params=()):
        self.sql, self.params = sql, params
        return []

    def executar(self, sql, params=()):
        self.sql, self.params = sql, params
        return 1


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

    def test_atualizar_manda_o_id_como_parametro(self):
        self.repositorio.atualizar(Livro.model_validate({**VALIDO, "id_livro": 7}))
        self.assertIn("UPDATE livros SET", self.database.sql)
        self.assertEqual(self.database.params[-1], 7)

    def test_atualizar_nao_mexe_na_data_de_cadastro(self):
        self.repositorio.atualizar(Livro.model_validate({**VALIDO, "id_livro": 7}))
        self.assertNotIn("data_cadastro", self.database.sql)

    def test_duplicado_ignora_o_proprio_id(self):
        self.repositorio.existe_duplicado("Titulo", "Autor", ignorar_id=5)
        self.assertIn("id_livro <> %s", self.database.sql)
        self.assertIn(5, self.database.params)

    def test_curinga_do_usuario_vira_texto_no_like(self):
        self.repositorio.listar(busca="100%_desconto")
        self.assertEqual(self.database.params[0], r"%100\%\_desconto%")

    def test_periodo_vira_between_com_parametros(self):
        self.repositorio.listar(periodo="1900-1949")
        self.assertIn("ano_lancamento BETWEEN %s AND %s", self.database.sql)
        self.assertIn(1900, self.database.params)
        self.assertIn(1949, self.database.params)

    def test_periodo_desconhecido_nao_entra_no_sql(self):
        self.repositorio.listar(periodo="1900; DROP TABLE livros")
        self.assertNotIn("BETWEEN", self.database.sql)
        self.assertNotIn("DROP", self.database.sql)

    def test_excluir_manda_delete_com_o_id(self):
        self.repositorio.excluir(3)
        self.assertEqual(self.database.sql, "DELETE FROM livros WHERE id_livro = %s")
        self.assertEqual(self.database.params, (3,))


class TestEdicao(unittest.TestCase):
    """Edição de um livro já cadastrado."""

    def setUp(self):
        self.service = novo_livro_service()
        for dados in ACERVO:
            self.service.cadastrar(dados)

    def test_editar_troca_os_dados(self):
        ok, livro = self.service.editar(1, {**ACERVO[0], "titulo": "Dom Casmurro (revisado)",
                                            "genero": "Classico"})
        self.assertTrue(ok)
        self.assertEqual(livro["titulo"], "Dom Casmurro (revisado)")
        self.assertEqual(livro["genero"], "Classico")
        self.assertEqual(livro["id_livro"], 1)

    def test_edicao_aparece_na_listagem(self):
        self.service.editar(1, {**ACERVO[0], "titulo": "Dom Casmurro (revisado)"})
        titulos = [livro["titulo"] for livro in self.service.listar({})]
        self.assertIn("Dom Casmurro (revisado)", titulos)
        self.assertNotIn("Dom Casmurro", titulos)

    def test_editar_mantem_id_e_data_de_cadastro(self):
        ok, livro = self.service.editar(1, {**ACERVO[0], "id_livro": 99,
                                            "data_cadastro": "2000-01-01"})
        self.assertTrue(ok)
        self.assertEqual(livro["id_livro"], 1)
        self.assertEqual(livro["data_cadastro"], date.today().isoformat())

    def test_editar_livro_que_nao_existe(self):
        ok, erros = self.service.editar(99, ACERVO[0])
        self.assertFalse(ok)
        self.assertEqual(erros, ["Livro não encontrado."])

    def test_editar_com_dados_invalidos(self):
        ok, erros = self.service.editar(1, {**ACERVO[0], "titulo": "   "})
        self.assertFalse(ok)
        self.assertEqual(erros, ["O campo título é obrigatório."])

    def test_salvar_sem_mudar_nada_nao_acusa_duplicata(self):
        ok, _ = self.service.editar(1, ACERVO[0])
        self.assertTrue(ok)

    def test_editar_para_titulo_e_autor_de_outro_livro(self):
        ok, erros = self.service.editar(1, {**ACERVO[0], "titulo": VALIDO["titulo"],
                                            "autor": VALIDO["autor"]})
        self.assertFalse(ok)
        self.assertEqual(erros, ["Já existe um livro com esse título e autor."])


class TestExclusao(unittest.TestCase):
    """Exclusão de um livro do acervo."""

    def setUp(self):
        self.service = novo_livro_service()
        for dados in ACERVO:
            self.service.cadastrar(dados)

    def titulos(self):
        return [livro["titulo"] for livro in self.service.listar({})]

    def test_remover_devolve_o_livro_excluido(self):
        ok, livro = self.service.remover(1)
        self.assertTrue(ok)
        self.assertEqual(livro["titulo"], ACERVO[0]["titulo"])

    def test_livro_some_da_listagem(self):
        self.service.remover(1)
        self.assertNotIn(ACERVO[0]["titulo"], self.titulos())
        self.assertEqual(len(self.titulos()), 2)

    def test_remover_livro_que_nao_existe(self):
        ok, erros = self.service.remover(99)
        self.assertFalse(ok)
        self.assertEqual(erros, ["Livro não encontrado."])

    def test_remover_duas_vezes_o_mesmo_livro(self):
        self.service.remover(1)
        ok, erros = self.service.remover(1)
        self.assertFalse(ok)
        self.assertEqual(erros, ["Livro não encontrado."])

    def test_cadastrar_depois_de_excluir_nao_repete_id(self):
        self.service.remover(3)
        ok, livro = self.service.cadastrar({**VALIDO, "titulo": "Outro livro"})
        self.assertTrue(ok)
        ids = [item["id_livro"] for item in self.service.listar({})]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(livro["id_livro"], 4)

    def test_titulo_liberado_depois_de_excluir(self):
        self.service.remover(1)
        ok, _ = self.service.cadastrar(ACERVO[0])
        self.assertTrue(ok)

    def test_editar_livro_excluido(self):
        self.service.remover(1)
        ok, erros = self.service.editar(1, ACERVO[0])
        self.assertFalse(ok)
        self.assertEqual(erros, ["Livro não encontrado."])


if __name__ == "__main__":
    unittest.main()
