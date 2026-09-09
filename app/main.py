"""Inicia o servidor local: serve o front-end estático e roteia /api/* para os controllers."""

import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from app.controllers import (
    auth_controller,
    autor_controller,
    categoria_controller,
    editora_controller,
    emprestimo_controller,
    exemplar_controller,
    leitor_controller,
    livro_controller,
)

RAIZ_PROJETO = Path(__file__).resolve().parent.parent
DIRETORIO_FRONTEND = RAIZ_PROJETO / "frontend"

ROTAS_API = {
    "autenticacao": auth_controller.roteador,
    "autores": autor_controller.roteador,
    "categorias": categoria_controller.roteador,
    "editoras": editora_controller.roteador,
    "livros": livro_controller.roteador,
    "exemplares": exemplar_controller.roteador,
    "leitores": leitor_controller.roteador,
    "emprestimos": emprestimo_controller.roteador,
}


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        caminho = urlparse(self.path).path
        if caminho == "/api/status":
            self._responder_json(
                200,
                {
                    "ok": True,
                    "mensagem": "Backend conectado ao front-end.",
                    "dados": {"servico": "book-book"},
                },
            )
            return
        if caminho.startswith("/api/"):
            self._despachar_api("GET", caminho)
            return
        self._servir_arquivo_estatico(caminho)

    def do_POST(self):
        self._despachar_api("POST", urlparse(self.path).path)

    def do_PUT(self):
        self._despachar_api("PUT", urlparse(self.path).path)

    def do_DELETE(self):
        self._despachar_api("DELETE", urlparse(self.path).path)

    def _despachar_api(self, metodo, caminho):
        partes = caminho.strip("/").split("/")
        recurso = partes[1] if len(partes) > 1 else ""
        subcaminho = "/".join(partes[2:])
        roteador = ROTAS_API.get(recurso)
        if roteador is None:
            self._responder_json(404, {"ok": False, "mensagem": f"Recurso '{recurso}' não encontrado."})
            return
        resposta = roteador(metodo, subcaminho, self._ler_corpo())
        codigo = resposta.get("codigo", 200 if resposta.get("ok") else 400)
        self._responder_json(codigo, resposta)

    def _ler_corpo(self):
        tamanho = int(self.headers.get("Content-Length", 0))
        if tamanho == 0:
            return None
        try:
            return json.loads(self.rfile.read(tamanho))
        except json.JSONDecodeError:
            return None

    def _servir_arquivo_estatico(self, caminho):
        if caminho == "/":
            caminho = "/index.html"
        caminho_arquivo = (DIRETORIO_FRONTEND / caminho.lstrip("/")).resolve()
        if not (caminho_arquivo == DIRETORIO_FRONTEND or caminho_arquivo.is_relative_to(DIRETORIO_FRONTEND)):
            self.send_error(403)
            return
        if not caminho_arquivo.is_file():
            self.send_error(404)
            return
        tipo, _ = mimetypes.guess_type(str(caminho_arquivo))
        self.send_response(200)
        self.send_header("Content-Type", tipo or "application/octet-stream")
        self.end_headers()
        self.wfile.write(caminho_arquivo.read_bytes())

    def _responder_json(self, codigo, corpo):
        dados = json.dumps(corpo).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(dados)))
        self.end_headers()
        self.wfile.write(dados)

    def log_message(self, formato, *args):
        pass


def iniciar_servidor(host="127.0.0.1", porta=8000):
    servidor = ThreadingHTTPServer((host, porta), RequestHandler)
    print(f"book-book rodando em http://{host}:{porta}")
    servidor.serve_forever()


if __name__ == "__main__":
    iniciar_servidor()
