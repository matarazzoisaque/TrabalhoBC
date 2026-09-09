"""Padronização das respostas JSON enviadas ao front-end."""


def sucesso(dados=None, mensagem: str = ""):
    return {"ok": True, "mensagem": mensagem, "dados": dados}


def erro(mensagem: str, codigo: int = 400):
    return {"ok": False, "mensagem": mensagem, "codigo": codigo}


def nao_implementado(recurso: str):
    return erro(f"'{recurso}' ainda não foi implementado.", codigo=501)
