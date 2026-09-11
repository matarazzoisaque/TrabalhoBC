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
        this.summaryCount = document.getElementById('summaryCount');
        this.summaryAuthors = document.getElementById('summaryAuthors');
        this.themeToggle = document.getElementById('themeToggle');
    }

    iniciar() {
        this.aplicarTemaSalvo();
        this.configurarTema();

        if (this.tabela) {
            this.carregarLivros();
        }
        if (this.formulario) {
            this.formulario.addEventListener('submit', (evento) => this.salvar(evento));
            this.formulario.addEventListener('reset', () => {
                this.exibirMensagem('Formulário limpo.');
            });
        }
    }

    aplicarTemaSalvo() {
        const saved = localStorage.getItem('biblioteca-theme') || 'light';
        document.body.dataset.theme = saved;
        this.atualizarTemaVisual(saved);
    }

    configurarTema() {
        if (!this.themeToggle) return;

        this.themeToggle.addEventListener('click', () => {
            const proximoTema = document.body.dataset.theme === 'light' ? 'dark' : 'light';
            document.body.dataset.theme = proximoTema;
            localStorage.setItem('biblioteca-theme', proximoTema);
            this.atualizarTemaVisual(proximoTema);
        });
    }

    atualizarTemaVisual(tema) {
        if (!this.themeToggle) return;

        const icon = this.themeToggle.querySelector('.theme-icon');
        const label = this.themeToggle.querySelector('.theme-label');

        if (tema === 'dark') {
            icon.textContent = '☼';
            label.textContent = 'Tema escuro';
        } else {
            icon.textContent = '☀';
            label.textContent = 'Tema claro';
        }
    }

    async carregarLivros() {
        this.exibirMensagem('Carregando livros...');
        try {
            const livros = await this.api.listarLivros();
            this.desenharTabela(livros);
            this.atualizarResumo(livros);
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

    atualizarResumo(livros) {
        if (!this.summaryCount || !this.summaryAuthors) return;

        const total = Array.isArray(livros) ? livros.length : 0;
        const autores = Array.isArray(livros) ? new Set(livros.map((livro) => livro.autor).filter(Boolean)).size : 0;

        this.summaryCount.textContent = String(total);
        this.summaryAuthors.textContent = String(autores);
    }

    async salvar(evento) {
        evento.preventDefault();

        if (!this.formulario) return;

        const botao = this.formulario.querySelector('button[type="submit"]');
        botao.disabled = true;
        this.exibirMensagem('Salvando...');

        const livro = {
            titulo: this.formulario.titulo.value,
            autor: this.formulario.autor.value,
            ano_publicacao: this.formulario.ano_publicacao.value
        };

        if (!livro.titulo || !livro.autor || !livro.ano_publicacao) {
            this.exibirMensagem('Preencha título, autor e ano para continuar.', 'erro');
            botao.disabled = false;
            return;
        }

        try {
            const salvo = await this.api.cadastrarLivro(livro);
            this.formulario.reset();
            this.exibirMensagem(`Livro "${salvo.titulo}" cadastrado com sucesso.`, 'sucesso');
            if (this.tabela) this.carregarLivros();
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        } finally {
            botao.disabled = false;
        }
    }

    exibirMensagem(texto, tipo = '') {
        if (!this.mensagem) return;

        this.mensagem.textContent = texto;
        this.mensagem.className = tipo ? `mensagem ${tipo}` : 'mensagem';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TelaLivros(new Api()).iniciar();
});
