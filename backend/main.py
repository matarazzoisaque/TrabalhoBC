from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import sys


BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

sys.path.insert(0, str(BASE_DIR))

from controle.urna_controle import UrnaControle


HOST = "127.0.0.1"
PORTA = 8080
urna_controle = UrnaControle()


class ServidorUrna(SimpleHTTPRequestHandler):
    def do_GET(self):
        rota = self.path.split("?", 1)[0]

        if rota in ("/", "/index.html"):
            self.enviar_arquivo(FRONTEND_DIR / "html" / "index.html", "text/html")
            return

        if rota == "/css/main.css":
            self.enviar_arquivo(FRONTEND_DIR / "css" / "main.css", "text/css")
            return

        if rota == "/js/main.js":
            self.enviar_arquivo(FRONTEND_DIR / "js" / "main.js", "text/javascript")
            return

        if rota == "/api/status":
            self.enviar_json(urna_controle.status())
            return

        if rota == "/api/professores":
            self.enviar_json(urna_controle.listar_professores())
            return

        self.send_error(404, "Recurso nao encontrado")

    def enviar_arquivo(self, caminho, tipo):
        if not caminho.exists():
            self.send_error(404, "Arquivo nao encontrado")
            return

        conteudo = caminho.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", f"{tipo}; charset=utf-8")
        self.send_header("Content-Length", str(len(conteudo)))
        self.end_headers()
        self.wfile.write(conteudo)

    def enviar_json(self, dados):
        conteudo = json.dumps(dados).encode("utf-8")
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
