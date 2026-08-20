from dao.professor_dao import ProfessorDAO
from validacao.voto_validacao import VotoValidacao


class UrnaControle:
    def __init__(self):
        self.professor_dao = ProfessorDAO()
        self.voto_validacao = VotoValidacao(self.professor_dao)

    def status(self):
        return {
            "status": "online",
            "backend": "Python POO",
            "banco_dados": "SQL Server sera conectado depois",
        }

    def listar_professores(self):
        professores = self.professor_dao.listar()
        return [professor.to_dict() for professor in professores]

    def validar_numero_professor(self, numero):
        professor = self.voto_validacao.validar_professor(numero)
        return professor.to_dict()
