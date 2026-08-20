from abstrato.dao_abstrato import DAOAbstrato
from modelo.professor import Professor


class ProfessorDAO(DAOAbstrato):
    def __init__(self):
        self.professores = [
            Professor(1, "Professor Exemplo 1", "01", ""),
            Professor(2, "Professor Exemplo 2", "02", ""),
            Professor(3, "Professor Exemplo 3", "03", ""),
        ]

    def listar(self):
        return self.professores

    def buscar_por_id(self, identificador):
        for professor in self.professores:
            if professor.id_professor == identificador:
                return professor
        return None

    def buscar_por_numero(self, numero):
        for professor in self.professores:
            if professor.numero_urna == str(numero).zfill(2):
                return professor
        return None

    def criar(self, entidade):
        self.professores.append(entidade)
        return entidade

    def atualizar(self, entidade):
        for indice, professor in enumerate(self.professores):
            if professor.id_professor == entidade.id_professor:
                self.professores[indice] = entidade
                return entidade
        return None

    def deletar(self, identificador):
        professor = self.buscar_por_id(identificador)
        if professor:
            self.professores.remove(professor)
            return True
        return False
