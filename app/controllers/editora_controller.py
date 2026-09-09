"""Controller de editoras: recebe requisições, chama services e devolve respostas."""

from app.utils import respostas


def roteador(metodo: str, subcaminho: str, corpo: dict | None = None):
    return respostas.nao_implementado("editoras")
