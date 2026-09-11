/* Comunicação com o back-end.
 *
 * A classe Api concentra todas as chamadas HTTP. Nenhuma outra parte do
 * front-end usa fetch diretamente. */

class Api {
    constructor(base = '/api') {
        this.base = base;
        this.livrosMock = [
            { id_livro: 1, titulo: 'O Pequeno Príncipe', autor: 'Antoine de Saint-Exupéry', ano_publicacao: 1943 },
            { id_livro: 2, titulo: 'Dom Casmurro', autor: 'Machado de Assis', ano_publicacao: 1899 },
            { id_livro: 3, titulo: 'Clean Code', autor: 'Robert C. Martin', ano_publicacao: 2008 }
        ];
    }

    /* Busca todos os livros cadastrados. */
    async listarLivros() {
        return this.livrosMock;
    }

    /* Envia um novo livro para ser cadastrado. */
    async cadastrarLivro(livro) {
        const novoLivro = {
            id_livro: this.proximoCodigo(),
            titulo: livro.titulo,
            autor: livro.autor,
            ano_publicacao: livro.ano_publicacao
        };

        this.livrosMock.push(novoLivro);
        return novoLivro;
    }

    proximoCodigo() {
        const maior = this.livrosMock.reduce((maiorId, livro) => Math.max(maiorId, Number(livro.id_livro) || 0), 0);
        return maior + 1;
    }
}
