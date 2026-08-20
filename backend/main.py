from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse
import json
import mimetypes
import sys


BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

sys.path.insert(0, str(BASE_DIR))

from controle.controle import Controle


HOST = "127.0.0.1"
PORTA = 8080
controle = Controle()


class ServidorUrna(SimpleHTTPRequestHandler):
    """Servidor local para o frontend e a API inicial da urna."""

    def do_GET(self):
        rota = urlparse(self.path).path

        if rota == "/api/status":
            self.enviar_json(controle.status())
            return

        if rota == "/api/ranking":
            self.enviar_json(controle.listar_ranking())
            return

        self.enviar_recurso_frontend(rota)

    def enviar_recurso_frontend(self, rota):
        caminho_relativo = "index.html" if rota in ("/", "/index.html") else rota.lstrip("/")
        caminho = (FRONTEND_DIR / unquote(caminho_relativo)).resolve()

        if FRONTEND_DIR not in caminho.parents and caminho != FRONTEND_DIR:
            self.send_error(403, "Recurso nao permitido")
            return

        if not caminho.is_file():
            self.send_error(404, "Recurso nao encontrado")
            return

        tipo, _ = mimetypes.guess_type(caminho.name)
        self.enviar_arquivo(caminho, tipo or "application/octet-stream")

    def enviar_arquivo(self, caminho, tipo):
        conteudo = caminho.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", f"{tipo}; charset=utf-8")
        self.send_header("Content-Length", str(len(conteudo)))
        self.end_headers()
        self.wfile.write(conteudo)

    def enviar_json(self, dados):
        conteudo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(conteudo)))
        self.end_headers()
        self.wfile.write(conteudo)


def main():
    servidor = ThreadingHTTPServer((HOST, PORTA), ServidorUrna)
    print(f"Servidor iniciado em http://{HOST}:{PORTA}")
    servidor.serve_forever()


if __name__ == "__main__":
    main()
