from abc import ABC, abstractmethod


class DAOAbstrato(ABC):
    @abstractmethod
    def listar(self):
        pass

    @abstractmethod
    def buscar_por_id(self, identificador):
        pass

    @abstractmethod
    def criar(self, entidade):
        pass

    @abstractmethod
    def atualizar(self, entidade):
        pass

    @abstractmethod
    def deletar(self, identificador):
        pass
