from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json


ROOT_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = ROOT_DIR / "frontend"
HTML_DIR = FRONTEND_DIR / "html"
CSS_DIR = FRONTEND_DIR / "css"
JS_DIR = FRONTEND_DIR / "js"

HOST = "127.0.0.1"
PORT = 8000


class AppHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        route = self.path.split("?", 1)[0]

        if route in ("/", "/index.html"):
            self._send_file(HTML_DIR / "index.html", "text/html; charset=utf-8")
            return

        if route == "/css/main.css":
            self._send_file(CSS_DIR / "main.css", "text/css; charset=utf-8")
            return

        if route == "/js/main.js":
            self._send_file(JS_DIR / "main.js", "text/javascript; charset=utf-8")
            return

        if route == "/api/status":
            self._send_json(
                {
                    "status": "online",
                    "backend": "Python",
                    "database": "SQL Server sera conectado depois",
                }
            )
            return

        self.send_error(404, "Recurso nao encontrado")

    def _send_file(self, file_path, content_type):
        if not file_path.exists():
            self.send_error(404, "Arquivo nao encontrado")
            return

        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def _send_json(self, payload):
        content = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


def main():
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Servidor iniciado em http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
