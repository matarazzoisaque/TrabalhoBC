"""Servidor HTTP do projeto.

Entrega os arquivos do front-end e responde à API em JSON, chamando o
LivroService. Nada de SQL, nada de validação.

O http.server cria uma instância desta classe a cada requisição, por isso
o service fica guardado como atributo de classe (preenchido no main.py).
"""

import json
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

from app.core.database import ErroBanco

PASTA_FRONTEND = Path(__file__).resolve().parents[2] / "frontend"
ROTA_LIVROS = "/api/livros"
ROTA_FILTROS = "/api/livros/filtros"


class Servidor(SimpleHTTPRequestHandler):
    """Recebe as requisições HTTP e devolve JSON ou arquivos do front-end."""

    service = None  # LivroService, definido no main.py

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PASTA_FRONTEND), **kwargs)

    def do_GET(self):
        """/api/livros (com filtros), /api/livros/filtros e arquivos do front-end."""
        rota = urlsplit(self.path)
        try:
            if rota.path == ROTA_LIVROS:
                self._responder(200, self.service.listar(dict(parse_qsl(rota.query))))
            elif rota.path == ROTA_FILTROS:
                self._responder(200, self.service.opcoes_de_filtro())
            else:
                self._servir_estatico()
        except ErroBanco as erro:
            self._responder(503, {"erro": str(erro)})

    def do_POST(self):
        """/api/livros cadastra um livro."""
        if urlsplit(self.path).path != ROTA_LIVROS:
            self._responder(404, {"erro": "Rota não encontrada."})
            return
        try:
            ok, resultado = self.service.cadastrar(self._ler_corpo())
        except json.JSONDecodeError:
            self._responder(400, {"erro": "O corpo enviado não é um JSON válido."})
            return
        except ErroBanco as erro:
            self._responder(503, {"erro": str(erro)})
            return

        if ok:
            self._responder(201, resultado)
        else:
            self._responder(400, {"erro": " ".join(resultado)})

    def do_PUT(self):
        """/api/livros/{id}: edita um livro."""
        raise NotImplementedError

    def do_DELETE(self):
        """/api/livros/{id}: remove um livro (exclusão lógica)."""
        raise NotImplementedError

    def end_headers(self):
        """Faz o navegador sempre conferir se o arquivo mudou (sem cache velho)."""
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def _ler_corpo(self) -> dict:
        """Lê o corpo da requisição e converte o JSON em dicionário."""
        tamanho = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(tamanho) or b"{}")

    def _responder(self, status: int, dados) -> None:
        """Envia o status, os headers e os dados em JSON."""
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _extrair_id(self, caminho):
        """Pega o {id} de uma URL no formato /api/livros/{id}."""
        raise NotImplementedError

    def _servir_estatico(self) -> None:
        """Entrega os arquivos HTML, CSS e JS da pasta frontend/."""
        super().do_GET()
