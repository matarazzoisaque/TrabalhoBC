class Abstrato:
    """Classe-base para compartilhar variaveis entre as camadas do backend."""

    def __init__(self, **variaveis):
        for nome, valor in variaveis.items():
            setattr(self, nome, valor)
