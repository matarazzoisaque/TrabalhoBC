"""Servidor HTTP do projeto.

Entrega os arquivos do front-end e responde à API em JSON, chamando os
services. Nada de SQL, nada de validação.

O http.server cria uma instância desta classe a cada requisição, por isso
os services ficam guardados como atributos de classe (preenchidos no main.py).

Rotas da API:
    GET    /api/livros                        listar (filtros na query string)
    GET    /api/livros/filtros                gêneros para o filtro da tela
    POST   /api/livros                        cadastrar
    PUT    /api/livros/{id}                   editar
    DELETE /api/livros/{id}                   excluir
    As mesmas quatro rotas de CRUD valem para /api/leitores e /api/exemplares.
    GET    /api/emprestimos                   listar
    POST   /api/emprestimos                   registrar empréstimo
    PUT    /api/emprestimos/{id}/devolucao    registrar devolução
"""

import json
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

from app.core.database import ErroBanco
from app.services.emprestimo_service import NAO_ENCONTRADO as EMPRESTIMO_NAO_ENCONTRADO
from app.services.exemplar_service import NAO_ENCONTRADO as EXEMPLAR_NAO_ENCONTRADO
from app.services.leitor_service import NAO_ENCONTRADO as LEITOR_NAO_ENCONTRADO
from app.services.livro_service import NAO_ENCONTRADO as LIVRO_NAO_ENCONTRADO

PASTA_FRONTEND = Path(__file__).resolve().parents[2] / "frontend"
PREFIXO_API = "/api/"

# Recursos que têm cadastrar, editar e excluir.
RECURSOS_CRUD = ("livros", "leitores", "exemplares")

# Mensagens dos services que viram 404 em vez de 400.
NAO_ENCONTRADOS = {
    LIVRO_NAO_ENCONTRADO,
    LEITOR_NAO_ENCONTRADO,
    EXEMPLAR_NAO_ENCONTRADO,
    EMPRESTIMO_NAO_ENCONTRADO,
}


class Servidor(SimpleHTTPRequestHandler):
    """Recebe as requisições HTTP e devolve JSON ou arquivos do front-end."""

    # Services definidos no main.py.
    livro_service = None
    leitor_service = None
    exemplar_service = None
    emprestimo_service = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PASTA_FRONTEND), **kwargs)

    def do_GET(self):
        """Listagens da API e arquivos do front-end."""
        rota = self._rota()
        if rota is None:
            self._servir_estatico()
            return

        recurso, id_registro, acao = rota
        service = self._service(recurso)
        filtros = dict(parse_qsl(urlsplit(self.path).query))

        if service is None or id_registro is not None:
            self._nao_encontrado()
        elif acao is None:
            self._executar(lambda: (True, service.listar(filtros)))
        elif recurso == "livros" and acao == "filtros":
            self._executar(lambda: (True, service.opcoes_de_filtro()))
        else:
            self._nao_encontrado()

    def do_POST(self):
        """Cadastra um livro, leitor ou exemplar, ou registra um empréstimo."""
        rota = self._rota()
        service = self._service(rota[0]) if rota else None
        if service is None or rota[1] is not None or rota[2] is not None:
            self._nao_encontrado()
            return

        acao = service.registrar if rota[0] == "emprestimos" else service.cadastrar
        self._executar(lambda: acao(self._ler_corpo()), status_ok=201)

    def do_PUT(self):
        """Edita um livro, leitor ou exemplar, ou registra a devolução de um empréstimo."""
        rota = self._rota()
        if rota is None or rota[1] is None:
            self._nao_encontrado()
            return

        recurso, id_registro, acao = rota
        if recurso in RECURSOS_CRUD and acao is None:
            service = self._service(recurso)
            self._executar(lambda: service.editar(id_registro, self._ler_corpo()))
        elif recurso == "emprestimos" and acao == "devolucao":
            self._executar(lambda: self.emprestimo_service.registrar_devolucao(id_registro))
        else:
            self._nao_encontrado()

    def do_DELETE(self):
        """Exclui um livro, leitor ou exemplar."""
        rota = self._rota()
        if rota is None or rota[0] not in RECURSOS_CRUD or rota[1] is None or rota[2] is not None:
            self._nao_encontrado()
            return

        service = self._service(rota[0])
        self._executar(lambda: service.remover(rota[1]))

    def end_headers(self):
        """Faz o navegador sempre conferir se o arquivo mudou (sem cache velho)."""
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def _service(self, recurso: str):
        """Devolve o service do recurso da URL, ou None se o recurso não existir."""
        return {
            "livros": self.livro_service,
            "leitores": self.leitor_service,
            "exemplares": self.exemplar_service,
            "emprestimos": self.emprestimo_service,
        }.get(recurso)

    def _rota(self) -> tuple[str, int | None, str | None] | None:
        """Quebra /api/{recurso}/{id}/{acao} em (recurso, id, acao).

        Devolve None quando o caminho não é da API (é um arquivo do front-end).
        Um caminho da API em formato inválido vira um recurso vazio, que dá 404.
        """
        caminho = urlsplit(self.path).path
        if not caminho.startswith(PREFIXO_API):
            return None

        partes = [parte for parte in caminho[len(PREFIXO_API):].split("/") if parte]
        if not partes:
            return "", None, None

        recurso, resto = partes[0], partes[1:]
        if not resto:
            return recurso, None, None
        if resto[0].isdigit() and len(resto) <= 2:
            return recurso, int(resto[0]), resto[1] if len(resto) == 2 else None
        if len(resto) == 1:
            return recurso, None, resto[0]
        return "", None, None

    def _executar(self, acao, status_ok: int = 200) -> None:
        """Chama o service e traduz o resultado (ok, dados_ou_erros) em resposta HTTP."""
        try:
            ok, resultado = acao()
        except json.JSONDecodeError:
            self._responder(400, {"erro": "O corpo enviado não é um JSON válido."})
            return
        except ErroBanco as erro:
            self._responder(503, {"erro": str(erro)})
            return

        if ok:
            self._responder(status_ok, resultado)
        else:
            status = 404 if resultado and resultado[0] in NAO_ENCONTRADOS else 400
            self._responder(status, {"erro": " ".join(resultado)})

    def _nao_encontrado(self) -> None:
        """Responde 404 para rota da API que não existe."""
        self._responder(404, {"erro": "Rota não encontrada."})

    def _ler_corpo(self) -> dict:
        """Lê o corpo da requisição e converte o JSON em dicionário."""
        tamanho = int(self.headers.get("Content-Length") or 0)
        dados = json.loads(self.rfile.read(tamanho) or b"{}")
        if not isinstance(dados, dict):
            raise json.JSONDecodeError("O corpo deve ser um objeto JSON.", "", 0)
        return dados

    def _responder(self, status: int, dados) -> None:
        """Envia o status, os headers e os dados em JSON."""
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _servir_estatico(self) -> None:
        """Entrega os arquivos HTML, CSS e JS da pasta frontend/."""
        super().do_GET()
