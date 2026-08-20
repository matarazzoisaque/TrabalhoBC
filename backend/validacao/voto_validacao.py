class VotoValidacao:
    def __init__(self, professor_dao):
        self.professor_dao = professor_dao

    def validar_professor(self, numero):
        professor = self.professor_dao.buscar_por_numero(numero)
        if not professor:
            raise ValueError("Professor nao encontrado.")
        return professor
