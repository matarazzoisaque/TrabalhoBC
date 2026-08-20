class Validacao:
    """Centraliza regras de validacao compartilhadas pela aplicacao."""

    @staticmethod
    def campo_obrigatorio(valor, nome):
        if valor is None or not str(valor).strip():
            raise ValueError(f"{nome} e obrigatorio.")
        return str(valor).strip()
