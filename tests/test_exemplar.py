"""Testes dos exemplares e do status.

Os repositórios em memória substituem o banco, então os testes rodam sem MySQL.

Execute a partir da raiz do projeto:

    python -m unittest tests.test_exemplar
"""

import unittest
from datetime import date

from pydantic import ValidationError

from app.models.exemplar import Exemplar
from app.repositories.emprestimo_repository import EmprestimoRepositoryMemoria
from app.repositories.exemplar_repository import ExemplarRepository, ExemplarRepositoryMemoria
from app.repositories.leitor_repository import LeitorRepositoryMemoria
from app.repositories.livro_repository import LivroRepositoryMemoria
from app.services.emprestimo_service import EmprestimoService
from app.services.exemplar_service import ExemplarService
from app.services.leitor_service import LeitorService
from app.services.livro_service import LivroService

DOM_CASMURRO = {"titulo": "Dom Casmurro", "autor": "Machado de Assis", "genero": "Romance",
                "ano_lancamento": 1899, "resumo": "Bentinho relembra Capitu."}
ORWELL = {"titulo": "1984", "autor": "George Orwell", "genero": "Ficção",
          "ano_lancamento": 1949, "resumo": "Distopia."}


class DatabaseQueGuardaSQL:
    """Guarda o SQL que o ExemplarRepository mandaria ao MySQL."""

    def __init__(self):
        self.sql = None
        self.params = None

    def consultar(self, sql, params=()):
        self.sql, self.params = sql, params
        return []


class TestExemplar(unittest.TestCase):
    """Validações feitas pelo pydantic ao criar um Exemplar."""

    def erros(self, dados):
        with self.assertRaises(ValidationError) as contexto:
            Exemplar.model_validate(dados)
        return Exemplar.mensagens_de_erro(contexto.exception)

    def test_status_padrao_e_disponivel(self):
        self.assertEqual(Exemplar.model_validate({"id_livro": 1}).status, "DISPONIVEL")

    def test_status_em_minusculas_e_aceito(self):
        self.assertEqual(Exemplar.model_validate({"id_livro": 1, "status": " emprestado "}).status, "EMPRESTADO")

    def test_livro_obrigatorio(self):
        self.assertEqual(self.erros({"id_livro": ""}), ["O campo livro é obrigatório."])
        self.assertEqual(self.erros({}), ["O campo livro é obrigatório."])

    def test_status_invalido(self):
        self.assertEqual(self.erros({"id_livro": 1, "status": "PERDIDO"}),
                         ["O campo status deve ser DISPONIVEL ou EMPRESTADO."])


class TestExemplarService(unittest.TestCase):
    """Regras dos exemplares passando pelo service."""

    def setUp(self):
        livros = LivroRepositoryMemoria()
        leitores = LeitorRepositoryMemoria()
        exemplares = ExemplarRepositoryMemoria(livros)
        emprestimos = EmprestimoRepositoryMemoria(leitores, exemplares)
        self.service = ExemplarService(exemplares, livros, emprestimos)
        self.livro_service = LivroService(livros, exemplares)
        self.emprestimo_service = EmprestimoService(emprestimos, leitores, exemplares)
        self.livro_service.cadastrar(DOM_CASMURRO)
        self.livro_service.cadastrar(ORWELL)
        LeitorService(leitores, emprestimos).cadastrar({"nome": "João Silva", "email": "joao@email.com"})

    def emprestar(self, id_exemplar):
        return self.emprestimo_service.registrar({"id_leitor": 1, "id_exemplar": id_exemplar,
                                                  "data_emprestimo": date.today().isoformat()})

    def test_cadastrar_comeca_disponivel_e_traz_o_titulo(self):
        ok, exemplar = self.service.cadastrar({"id_livro": 1})
        self.assertTrue(ok)
        self.assertEqual(exemplar["id_exemplar"], 1)
        self.assertEqual(exemplar["status"], "DISPONIVEL")
        self.assertEqual(exemplar["titulo_livro"], "Dom Casmurro")

    def test_cadastrar_com_livro_que_nao_existe(self):
        self.assertEqual(self.service.cadastrar({"id_livro": 99}), (False, ["O livro selecionado não existe."]))

    def test_cadastrar_ja_emprestado_e_recusado(self):
        ok, erros = self.service.cadastrar({"id_livro": 1, "status": "EMPRESTADO"})
        self.assertFalse(ok)
        self.assertIn("muda sozinho", erros[0])

    def test_editar_troca_o_livro(self):
        self.service.cadastrar({"id_livro": 1})
        ok, exemplar = self.service.editar(1, {"id_livro": 2})
        self.assertTrue(ok)
        self.assertEqual(exemplar["titulo_livro"], "1984")

    def test_editar_status_para_emprestado_e_recusado(self):
        self.service.cadastrar({"id_livro": 1})
        ok, erros = self.service.editar(1, {"id_livro": 1, "status": "EMPRESTADO"})
        self.assertFalse(ok)
        self.assertIn("muda sozinho", erros[0])

    def test_editar_exemplar_emprestado_e_recusado(self):
        self.service.cadastrar({"id_livro": 1})
        self.emprestar(1)
        ok, erros = self.service.editar(1, {"id_livro": 2})
        self.assertFalse(ok)
        self.assertEqual(erros, ["Este exemplar está emprestado. Registre a devolução antes de alterá-lo."])

    def test_editar_exemplar_que_nao_existe(self):
        self.assertEqual(self.service.editar(99, {"id_livro": 1}), (False, ["Exemplar não encontrado."]))

    def test_remover_exemplar_nunca_emprestado(self):
        self.service.cadastrar({"id_livro": 1})
        ok, exemplar = self.service.remover(1)
        self.assertTrue(ok)
        self.assertEqual(exemplar["id_exemplar"], 1)
        self.assertEqual(self.service.listar({}), [])

    def test_remover_exemplar_emprestado_e_recusado(self):
        self.service.cadastrar({"id_livro": 1})
        self.emprestar(1)
        ok, erros = self.service.remover(1)
        self.assertFalse(ok)
        self.assertEqual(erros, ["Este exemplar está emprestado e não pode ser excluído."])

    def test_remover_exemplar_disponivel_com_historico_e_recusado(self):
        self.service.cadastrar({"id_livro": 1})
        self.emprestar(1)
        self.emprestimo_service.registrar_devolucao(1)
        ok, erros = self.service.remover(1)
        self.assertFalse(ok)
        self.assertEqual(erros, [
            "Este exemplar já foi emprestado antes e não pode ser excluído, "
            "para não apagar o histórico de empréstimos."
        ])

    def test_listar_disponiveis_e_busca_por_titulo(self):
        self.service.cadastrar({"id_livro": 1})
        self.service.cadastrar({"id_livro": 2})
        self.emprestar(1)
        disponiveis = self.service.listar({"status": "disponivel"})
        self.assertEqual([exemplar["id_exemplar"] for exemplar in disponiveis], [2])
        self.assertEqual([exemplar["titulo_livro"] for exemplar in self.service.listar({"busca": "casmurro"})],
                         ["Dom Casmurro"])

    def test_status_desconhecido_no_filtro_e_ignorado(self):
        self.service.cadastrar({"id_livro": 1})
        self.assertEqual(len(self.service.listar({"status": "PERDIDO"})), 1)

    def test_livro_com_exemplar_nao_pode_ser_excluido(self):
        self.service.cadastrar({"id_livro": 1})
        ok, erros = self.livro_service.remover(1)
        self.assertFalse(ok)
        self.assertEqual(erros, ["Este livro tem exemplares cadastrados e não pode ser excluído."])


class TestSQLDoExemplarRepository(unittest.TestCase):
    """O SQL usa o JOIN com livros e manda os valores como parâmetro."""

    def setUp(self):
        self.database = DatabaseQueGuardaSQL()
        self.repositorio = ExemplarRepository(self.database)

    def test_listar_disponiveis_usa_join_e_parametro(self):
        self.repositorio.listar(status="DISPONIVEL")
        self.assertIn("JOIN livros l ON l.id_livro = e.id_livro", self.database.sql)
        self.assertIn("e.status = %s", self.database.sql)
        self.assertEqual(self.database.params, ("DISPONIVEL",))

    def test_existe_para_livro(self):
        self.repositorio.existe_para_livro(4)
        self.assertEqual(self.database.sql, "SELECT 1 FROM exemplares WHERE id_livro = %s LIMIT 1")
        self.assertEqual(self.database.params, (4,))


if __name__ == "__main__":
    unittest.main()
