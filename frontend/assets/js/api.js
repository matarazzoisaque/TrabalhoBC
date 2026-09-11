/* Comunicação com o back-end.
 *
 * A classe Api concentra todas as chamadas HTTP. Nenhuma outra parte do
 * front-end usa fetch diretamente. */

class Api {
    constructor(base = '/api') {
        this.base = base;
        this.livrosMock = [
            { id_livro: 1, titulo: 'O Pequeno Príncipe', autor: 'Antoine de Saint-Exupéry', genero: 'Fábula', paginas: 96, data_lancamento: '2024-01-10', data_cadastro: '2024-01-10' },
            { id_livro: 2, titulo: 'Dom Casmurro', autor: 'Machado de Assis', genero: 'Romance', paginas: 256, data_lancamento: '2023-10-02', data_cadastro: '2023-10-02' },
            { id_livro: 3, titulo: 'Clean Code', autor: 'Robert C. Martin', genero: 'Técnico', paginas: 464, data_lancamento: '2022-08-20', data_cadastro: '2022-08-20' },
            { id_livro: 4, titulo: 'A Revolução dos Bichos', autor: 'George Orwell', genero: 'Ficção', paginas: 164, data_lancamento: '2023-03-14', data_cadastro: '2023-03-14' },
            { id_livro: 5, titulo: 'Os Sertões', autor: 'Euclides da Cunha', genero: 'História', paginas: 438, data_lancamento: '2021-10-30', data_cadastro: '2021-10-30' }
        ];
    }

    async listarLivros() {
        return this.livrosMock;
    }

    async cadastrarLivro(livro) {
        const novoLivro = {
            id_livro: this.proximoCodigo(),
            titulo: livro.titulo,
            autor: livro.autor,
            genero: livro.genero,
            paginas: Number(livro.paginas),
            data_lancamento: livro.data_lancamento || livro.data_cadastro || new Date().toISOString().slice(0, 10),
            data_cadastro: livro.data_cadastro || new Date().toISOString().slice(0, 10)
        };

        this.livrosMock.push(novoLivro);
        return novoLivro;
    }

    async atualizarLivro(id_livro, livro) {
        const alvo = this.livrosMock.find((livroItem) => Number(livroItem.id_livro) === Number(id_livro));
        if (!alvo) return null;

        Object.assign(alvo, {
            titulo: livro.titulo,
            autor: livro.autor,
            genero: livro.genero,
            paginas: Number(livro.paginas),
            data_lancamento: livro.data_lancamento || livro.data_cadastro || alvo.data_lancamento,
            data_cadastro: livro.data_cadastro || alvo.data_cadastro
        });

        return alvo;
    }

    async excluirLivro(id_livro) {
        const indice = this.livrosMock.findIndex((livro) => Number(livro.id_livro) === Number(id_livro));
        if (indice >= 0) {
            const [removido] = this.livrosMock.splice(indice, 1);
            return removido;
        }

        return null;
    }

    proximoCodigo() {
        const maior = this.livrosMock.reduce((maiorId, livro) => Math.max(maiorId, Number(livro.id_livro) || 0), 0);
        return maior + 1;
    }
}
