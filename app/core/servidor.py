"""Servidor HTTP do projeto.

Usa apenas a biblioteca padrão do Python. Faz dois trabalhos:

1. Entrega os arquivos estáticos da pasta `frontend/` (HTML, CSS e JS).
2. Responde às rotas `/api/*` em JSON, chamando o service correspondente.

Como as páginas e a API são servidas pelo mesmo endereço, o front-end
conversa com o back-end sem precisar de configuração extra.
"""

import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

from app.core.database import ErroBanco
from app.services.livro_service import ErroValidacao

PASTA_FRONTEND = Path(__file__).resolve().parents[2] / "frontend"
LIMITE_CORPO = 1024 * 1024  # 1 MB


class Servidor:
    """Sobe o servidor HTTP local e liga as rotas da API ao service."""

    def __init__(self, host, porta, livro_service):
        self._host = host
        self._porta = porta
        self._livro_service = livro_service

    def iniciar(self):
        """Inicia o servidor e fica aguardando requisições."""
        manipulador = self._criar_manipulador()
        servidor = HTTPServer((self._host, self._porta), manipulador)
        print(f"Servidor no ar em http://{self._host}:{self._porta}")
        print("Pressione Ctrl+C para encerrar.")
        try:
            servidor.serve_forever()
        except KeyboardInterrupt:
            print("\nEncerrando o servidor.")
        finally:
            servidor.server_close()

    def _criar_manipulador(self):
        """Cria a classe que trata as requisições, já com o service injetado."""
        livro_service = self._livro_service

        class Manipulador(SimpleHTTPRequestHandler):
            """Trata cada requisição: arquivo estático ou rota da API."""

            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(PASTA_FRONTEND), **kwargs)

            def do_GET(self):
                if self.path.startswith("/api/"):
                    self._tratar_api(self._get_api)
                else:
                    super().do_GET()

            def do_POST(self):
                if self.path.startswith("/api/"):
                    self._tratar_api(self._post_api)
                else:
                    self._responder(404, {"erro": "Rota não encontrada."})

            # --- rotas da API ---

            def _get_api(self):
                if self._rota() == "/api/livros":
                    return 200, livro_service.listar()
                return 404, {"erro": "Rota não encontrada."}

            def _post_api(self):
                if self._rota() == "/api/livros":
                    return 201, livro_service.cadastrar(self._ler_json())
                return 404, {"erro": "Rota não encontrada."}

            # --- apoio ---

            def _rota(self):
                """Caminho da requisição sem a query string e sem barra final."""
                caminho = self.path.split("?", 1)[0]
                return caminho.rstrip("/") or "/"

            def _tratar_api(self, acao):
                """Executa a rota e traduz qualquer erro em uma resposta JSON."""
                try:
                    status, corpo = acao()
                except ErroValidacao as erro:
                    status, corpo = 400, {"erro": str(erro)}
                except ErroBanco as erro:
                    status, corpo = 503, {"erro": str(erro)}
                except json.JSONDecodeError:
                    status, corpo = 400, {"erro": "O corpo enviado não é um JSON válido."}
                except Exception as erro:  # falha inesperada
                    status, corpo = 500, {"erro": f"Erro interno do servidor: {erro}"}
                self._responder(status, corpo)

            def _ler_json(self):
                """Lê e converte o corpo JSON enviado pelo front-end."""
                tamanho = int(self.headers.get("Content-Length") or 0)
                if tamanho <= 0:
                    return {}
                if tamanho > LIMITE_CORPO:
                    raise ErroValidacao("Corpo da requisição grande demais.")
                corpo = self.rfile.read(tamanho).decode("utf-8")
                dados = json.loads(corpo)
                if not isinstance(dados, dict):
                    raise ErroValidacao("O corpo enviado deve ser um objeto JSON.")
                return dados

            def _responder(self, status, corpo):
                """Envia a resposta em JSON."""
                conteudo = json.dumps(corpo, ensure_ascii=False).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(conteudo)))
                self.end_headers()
                self.wfile.write(conteudo)

        return Manipulador
