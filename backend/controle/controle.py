class Controle:
    """Coordena os dados expostos pela API da urna."""

    def status(self):
        return {
            "status": "online",
            "servico": "urna-eletronica",
        }

    def listar_ranking(self):
        return []
