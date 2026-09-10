/* Telas de livros.
 *
 * A mesma classe atende as duas páginas: monta a listagem em index.html e
 * trata o envio do formulário em cadastro.html. */

class TelaLivros {
    constructor(api) {
        this.api = api;
        this.mensagem = document.getElementById('mensagem');
        this.tabela = document.getElementById('tabela-livros');
        this.corpoTabela = document.getElementById('corpo-tabela');
        this.formulario = document.getElementById('formulario-livro');
    }

    /* Decide o que fazer conforme a página aberta. */
    iniciar() {
        if (this.tabela) {
            this.carregarLivros();
        }
        if (this.formulario) {
            this.formulario.addEventListener('submit', (evento) => this.salvar(evento));
        }
    }

    /* Busca os livros na API e desenha a tabela. */
    async carregarLivros() {
        this.exibirMensagem('Carregando livros...');
        try {
            const livros = await this.api.listarLivros();
            this.desenharTabela(livros);
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    desenharTabela(livros) {
        this.corpoTabela.replaceChildren();

        if (!livros || livros.length === 0) {
            this.exibirMensagem('Nenhum livro cadastrado ainda.');
            this.tabela.hidden = true;
            return;
        }

        for (const livro of livros) {
            const linha = document.createElement('tr');
            for (const valor of [livro.id_livro, livro.titulo, livro.autor, livro.ano_publicacao]) {
                const celula = document.createElement('td');
                celula.textContent = valor;
                linha.appendChild(celula);
            }
            this.corpoTabela.appendChild(linha);
        }

        this.tabela.hidden = false;
        this.exibirMensagem(`${livros.length} livro(s) encontrado(s).`);
    }

    /* Envia o formulário de cadastro para a API. */
    async salvar(evento) {
        evento.preventDefault();

        const botao = this.formulario.querySelector('button[type="submit"]');
        botao.disabled = true;
        this.exibirMensagem('Salvando...');

        const livro = {
            titulo: this.formulario.titulo.value,
            autor: this.formulario.autor.value,
            ano_publicacao: this.formulario.ano_publicacao.value
        };

        try {
            const salvo = await this.api.cadastrarLivro(livro);
            this.formulario.reset();
            this.exibirMensagem(`Livro "${salvo.titulo}" cadastrado com sucesso.`, 'sucesso');
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        } finally {
            botao.disabled = false;
        }
    }

    exibirMensagem(texto, tipo = '') {
        this.mensagem.textContent = texto;
        this.mensagem.className = tipo ? `mensagem ${tipo}` : 'mensagem';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TelaLivros(new Api()).iniciar();
});
