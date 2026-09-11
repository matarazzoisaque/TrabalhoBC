/* Comunicação com o back-end.
 *
 * A classe Api concentra todas as chamadas HTTP. Nenhuma outra parte do
 * front-end usa fetch diretamente. */

class Api {
    constructor(base = '/api') {
        this.base = base;
    }

    /* Busca os livros; filtros e ordenação são aplicados pelo servidor. */
    async listarLivros(filtros = {}) {
        const parametros = new URLSearchParams();
        for (const [chave, valor] of Object.entries(filtros)) {
            if (valor) parametros.append(chave, valor);
        }
        const consulta = parametros.toString();
        return this.requisitar(consulta ? `/livros?${consulta}` : '/livros');
    }

    /* Autores e gêneros cadastrados, para preencher os filtros. */
    async opcoesDeFiltro() {
        return this.requisitar('/livros/filtros');
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
            throw new Error(
                'Não foi possível falar com o servidor. Rode "python -m app.main" '
                + 'e abra o sistema por http://127.0.0.1:8000 (não pelo arquivo).'
            );
        }

        const corpo = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            throw new Error(corpo && corpo.erro ? corpo.erro : `Erro ${resposta.status} ao acessar o servidor.`);
        }

        return corpo;
    }
}
