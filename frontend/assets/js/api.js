/* Comunicação com o back-end.
 *
 * A classe Api concentra todas as chamadas HTTP. Nenhuma outra parte do
 * front-end usa fetch diretamente. */

class Api {
    constructor(base = '/api') {
        this.base = base;
    }

    /* Busca todos os livros cadastrados. */
    async listarLivros() {
        return this.requisitar('/livros');
    }

    /* Envia um novo livro para ser cadastrado. */
    async cadastrarLivro(livro) {
        return this.requisitar('/livros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(livro)
        });
    }

    /* Faz a requisição e transforma erro do servidor em exceção. */
    async requisitar(caminho, opcoes = {}) {
        let resposta;
        try {
            resposta = await fetch(this.base + caminho, opcoes);
        } catch (erro) {
            throw new Error('Não foi possível falar com o servidor. Ele está rodando?');
        }

        const corpo = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            const mensagem = corpo && corpo.erro
                ? corpo.erro
                : `Erro ${resposta.status} ao acessar o servidor.`;
            throw new Error(mensagem);
        }

        return corpo;
    }
}
