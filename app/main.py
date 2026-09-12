"""Ponto de entrada do sistema.

Monta a cadeia de dependências uma única vez e sobe o servidor HTTP.

Execute a partir da raiz do projeto:

    python -m app.main
"""

from http.server import HTTPServer

from app.core.database import Database
from app.core.servidor import Servidor
from app.repositories.livro_repository import LivroRepository, LivroRepositoryMemoria
from app.services.livro_service import LivroService
from config import config

# Livros de exemplo do modo em memória (os mesmos do database/dml_inicial.sql).
LIVROS_DE_EXEMPLO = [
    {"titulo": "Dom Casmurro", "autor": "Machado de Assis", "genero": "Realismo", "ano_lancamento": 1899,
     "resumo": "Bentinho relembra a juventude e o casamento com Capitu, tentando provar a si mesmo "
               "uma traição que nunca fica clara."},
    {"titulo": "Grande Sertão: Veredas", "autor": "João Guimarães Rosa", "genero": "Modernismo",
     "ano_lancamento": 1956,
     "resumo": "O ex-jagunço Riobaldo narra suas andanças pelo sertão, as guerras entre bandos e o "
               "amor proibido por Diadorim."},
    {"titulo": "Vidas Secas", "autor": "Graciliano Ramos", "genero": "Regionalismo", "ano_lancamento": 1938,
     "resumo": "Fabiano, Sinhá Vitória, os filhos e a cachorra Baleia fogem da seca e enfrentam a "
               "miséria e a injustiça no sertão nordestino."},
    {"titulo": "Memórias Póstumas de Brás Cubas", "autor": "Machado de Assis", "genero": "Realismo",
     "ano_lancamento": 1881,
     "resumo": "Depois de morto, Brás Cubas conta a própria vida com ironia, expondo a vaidade e a "
               "hipocrisia da elite do século XIX."},
    {"titulo": "O Cortiço", "autor": "Aluísio Azevedo", "genero": "Naturalismo", "ano_lancamento": 1890,
     "resumo": "A vida em um cortiço do Rio de Janeiro mostra como o meio e a ambição moldam o "
               "destino dos moradores e do dono, João Romão."},
]


def principal():
    """Monta repositório -> LivroService -> Servidor e sobe o servidor."""
    if config.USAR_BANCO_MEMORIA:
        service = LivroService(LivroRepositoryMemoria())
        for dados in LIVROS_DE_EXEMPLO:
            service.cadastrar(dados)
        print("Modo em memória: começa com livros de exemplo; os cadastros somem ao reiniciar.")
    else:
        db = Database(config.DB_HOST, config.DB_USER, config.DB_PASSWORD, config.DB_NAME)
        service = LivroService(LivroRepository(db))

    Servidor.service = service

    servidor = HTTPServer((config.SERVIDOR_HOST, config.SERVIDOR_PORTA), Servidor)
    print(f"Servidor no ar em http://{config.SERVIDOR_HOST}:{config.SERVIDOR_PORTA}")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nEncerrando o servidor.")
    finally:
        servidor.server_close()


if __name__ == "__main__":
    principal()
