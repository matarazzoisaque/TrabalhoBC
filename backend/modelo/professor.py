class Professor:
    def __init__(self, id_professor, nome, numero_urna, foto_url):
        self.id_professor = id_professor
        self.nome = nome
        self.numero_urna = numero_urna
        self.foto_url = foto_url

    def to_dict(self):
        return {
            "id": self.id_professor,
            "nome": self.nome,
            "numero": self.numero_urna,
            "foto": self.foto_url,
        }
