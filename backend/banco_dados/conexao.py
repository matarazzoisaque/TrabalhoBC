class ConexaoBancoDados:
    def __init__(self):
        self.servidor = ""
        self.banco = ""
        self.usuario = ""
        self.senha = ""

    def conectar(self):
        raise NotImplementedError("Conexao com SQL Server sera implementada depois.")
