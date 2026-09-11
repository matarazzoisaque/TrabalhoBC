/* Telas de livros.
 *
 * A mesma classe atende as páginas de catálogo e cadastro da interface. */

class TelaLivros {
    constructor(api) {
        this.api = api;
        this.mensagem = document.getElementById('mensagem');
        this.catalogList = document.getElementById('catalogList');
        this.formulario = document.getElementById('formulario-livro');
        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.modalTitle = document.getElementById('modalTitle');
        this.closeModal = document.getElementById('closeModal');
        this.cancelForm = document.getElementById('cancelForm');
        this.openForm = document.getElementById('openForm');
        this.searchInput = document.getElementById('searchInput');
        this.filterAutor = document.getElementById('filterAutor');
        this.filterGenero = document.getElementById('filterGenero');
        this.filterPaginas = document.getElementById('filterPaginas');
        this.sortSelect = document.getElementById('sortSelect');
        this.themeToggle = document.getElementById('themeToggle');
        this.livros = [];
        this.livroEditandoId = null;
    }

    iniciar() {
        this.aplicarTemaSalvo();
        this.configurarTema();
        this.configurarCatalogo();
        this.configurarFormulario();
        this.carregarLivros();
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
        if (!icon) return;

        icon.textContent = tema === 'dark' ? '☼' : '☀';
    }

    configurarCatalogo() {
        if (this.openForm) {
            this.openForm.addEventListener('click', () => this.abrirModalCadastro());
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.aplicarFiltros());
        }

        if (this.filterAutor) {
            this.filterAutor.addEventListener('change', () => this.aplicarFiltros());
        }

        if (this.filterGenero) {
            this.filterGenero.addEventListener('change', () => this.aplicarFiltros());
        }

        if (this.filterPaginas) {
            this.filterPaginas.addEventListener('change', () => this.aplicarFiltros());
        }

        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', () => this.aplicarFiltros());
        }
    }

    configurarFormulario() {
        if (!this.formulario) return;

        this.formulario.addEventListener('submit', (evento) => this.salvar(evento));
        this.formulario.addEventListener('reset', () => {
            this.livroEditandoId = null;
            this.exibirMensagem('Formulário limpo.');
        });

        if (this.closeModal) {
            this.closeModal.addEventListener('click', () => this.fecharModal());
        }

        if (this.cancelForm) {
            this.cancelForm.addEventListener('click', () => this.fecharModal());
        }

        if (this.modalBackdrop) {
            this.modalBackdrop.addEventListener('click', (evento) => {
                if (evento.target === this.modalBackdrop) {
                    this.fecharModal();
                }
            });
        }
    }

    async carregarLivros() {
        this.exibirMensagem('Carregando livros...');
        try {
            this.livros = await this.api.listarLivros();
            this.atualizarFiltros(this.livros);
            this.aplicarFiltros();
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    atualizarFiltros(livros) {
        if (!Array.isArray(livros)) return;

        if (this.filterAutor) {
            const autores = [...new Set(livros.map((livro) => livro.autor).filter(Boolean))].sort();
            const atual = this.filterAutor.value || '';
            this.filterAutor.replaceChildren();
            this.filterAutor.appendChild(new Option('Todos', ''));
            for (const autor of autores) {
                this.filterAutor.appendChild(new Option(autor, autor));
            }
            if (autores.includes(atual)) {
                this.filterAutor.value = atual;
            }
        }

        if (this.filterGenero) {
            const generos = [...new Set(livros.map((livro) => livro.genero).filter(Boolean))].sort();
            const atual = this.filterGenero.value || '';
            this.filterGenero.replaceChildren();
            this.filterGenero.appendChild(new Option('Todos', ''));
            for (const genero of generos) {
                this.filterGenero.appendChild(new Option(genero, genero));
            }
            if (generos.includes(atual)) {
                this.filterGenero.value = atual;
            }
        }
    }

    aplicarFiltros() {
        if (!Array.isArray(this.livros)) return;

        const busca = (this.searchInput ? this.searchInput.value.trim().toLowerCase() : '');
        const autor = this.filterAutor ? this.filterAutor.value : '';
        const genero = this.filterGenero ? this.filterGenero.value : '';
        const paginas = this.filterPaginas ? this.filterPaginas.value : '';
        const sort = this.sortSelect ? this.sortSelect.value : 'titulo-asc';

        let lista = this.livros.filter((livro) => {
            const buscaTexto = `${livro.titulo} ${livro.autor} ${livro.genero}`.toLowerCase();
            const atendeBusca = !busca || buscaTexto.includes(busca);
            const atendeAutor = !autor || livro.autor === autor;
            const atendeGenero = !genero || livro.genero === genero;
            const atendePaginas = !paginas || this.filtrarPorPaginas(livro.paginas, paginas);

            return atendeBusca && atendeAutor && atendeGenero && atendePaginas;
        });

        lista = this.ordenarLivros(lista, sort);
        this.desenharCatalogo(lista);
    }

    filtrarPorPaginas(paginas, faixa) {
        if (faixa === '500+') return Number(paginas) >= 500;
        const [inicio, fim] = faixa.split('-').map(Number);
        return Number(paginas) >= inicio && Number(paginas) <= fim;
    }

    ordenarLivros(livros, sort) {
        const lista = [...livros];
        switch (sort) {
            case 'titulo-asc':
                return lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
            case 'titulo-desc':
                return lista.sort((a, b) => b.titulo.localeCompare(a.titulo));
            case 'autor-asc':
                return lista.sort((a, b) => a.autor.localeCompare(b.autor));
            case 'autor-desc':
                return lista.sort((a, b) => b.autor.localeCompare(a.autor));
            case 'paginas-asc':
                return lista.sort((a, b) => Number(a.paginas) - Number(b.paginas));
            case 'paginas-desc':
                return lista.sort((a, b) => Number(b.paginas) - Number(a.paginas));
            case 'data-desc':
                return lista.sort((a, b) => new Date(b.data_cadastro) - new Date(a.data_cadastro));
            case 'data-asc':
                return lista.sort((a, b) => new Date(a.data_cadastro) - new Date(b.data_cadastro));
            case 'lancamento-desc':
                return lista.sort((a, b) => new Date(b.data_lancamento) - new Date(a.data_lancamento));
            case 'lancamento-asc':
                return lista.sort((a, b) => new Date(a.data_lancamento) - new Date(b.data_lancamento));
            default:
                return lista;
        }
    }

    desenharCatalogo(livros) {
        if (!this.catalogList) return;

        this.catalogList.replaceChildren();

        if (!livros || livros.length === 0) {
            this.exibirMensagem('Nenhum livro encontrado.', 'erro');
            return;
        }

        for (const livro of livros) {
            const item = document.createElement('article');
            item.className = 'catalog-item';

            const esquerda = document.createElement('div');
            esquerda.className = 'book-main';
            esquerda.innerHTML = `
                <div class="book-title">${livro.titulo}</div>
                <div class="book-author">${livro.autor}</div>
            `;

            const genero = document.createElement('div');
            genero.className = 'book-meta-column';
            genero.innerHTML = `<span class="book-label">GÊNERO</span><span class="book-value">${livro.genero || 'Gênero'}</span>`;

            const paginas = document.createElement('div');
            paginas.className = 'book-meta-column';
            paginas.innerHTML = `<span class="book-label">PÁGINAS</span><span class="book-value">${livro.paginas || 0}</span>`;

            const lancamento = document.createElement('div');
            lancamento.className = 'book-meta-column';
            lancamento.innerHTML = `<span class="book-label">DATA DE LANÇAMENTO</span><span class="book-value">${this.formatarData(livro.data_lancamento || livro.data_cadastro)}</span>`;

            const cadastro = document.createElement('div');
            cadastro.className = 'book-meta-column';
            cadastro.innerHTML = `<span class="book-label">DATA DE CADASTRO</span><span class="book-value">${this.formatarData(livro.data_cadastro)}</span>`;

            const actions = document.createElement('div');
            actions.className = 'book-actions';

            const view = this.criarBotaoAcao('👁', 'Ver livro', 'view');
            const edit = this.criarBotaoAcao('✎', 'Editar livro', 'edit');
            const del = this.criarBotaoAcao('×', 'Excluir livro', 'delete');

            view.addEventListener('click', () => this.visualizarLivro(livro));
            edit.addEventListener('click', () => this.editarLivro(livro));
            del.addEventListener('click', () => this.excluirLivro(livro));

            actions.append(view, edit, del);
            item.append(esquerda, genero, paginas, lancamento, cadastro, actions);
            this.catalogList.appendChild(item);
        }

        this.exibirMensagem(`${livros.length} livro(s) encontrado(s).`);
    }

    criarBotaoAcao(icone, titulo, tipo) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = tipo === 'delete' ? 'icon-button delete' : 'icon-button';
        btn.title = titulo;
        btn.innerHTML = icone;
        return btn;
    }

    formatarData(data) {
        if (!data) return 'Sem data';
        const date = new Date(`${data}T00:00:00`);
        if (Number.isNaN(date.getTime())) return data;
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    }

    abrirModalCadastro() {
        this.livroEditandoId = null;
        this.modalTitle.textContent = 'Cadastrar livro';
        this.formulario.reset();
        if (this.modalBackdrop) {
            this.modalBackdrop.classList.add('open');
        }
    }

    fecharModal() {
        if (this.modalBackdrop) {
            this.modalBackdrop.classList.remove('open');
        }
        if (this.formulario) {
            this.formulario.reset();
        }
        this.livroEditandoId = null;
    }

    visualizarLivro(livro) {
        this.modalTitle.textContent = livro.titulo;
        this.preencherFormulario(livro);
        this.formulario.querySelector('button[type="submit"]').textContent = 'Fechar';
        this.formulario.querySelector('button[type="submit"]').disabled = true;
        this.formulario.querySelector('#cancelForm').textContent = 'Voltar';
        if (this.modalBackdrop) {
            this.modalBackdrop.classList.add('open');
        }
    }

    editarLivro(livro) {
        this.livroEditandoId = livro.id_livro;
        this.modalTitle.textContent = 'Editar livro';
        this.preencherFormulario(livro);
        if (this.modalBackdrop) {
            this.modalBackdrop.classList.add('open');
        }
    }

    preencherFormulario(livro) {
        if (!this.formulario) return;
        this.formulario.titulo.value = livro.titulo || '';
        this.formulario.autor.value = livro.autor || '';
        this.formulario.genero.value = livro.genero || '';
        this.formulario.paginas.value = livro.paginas || '';
        this.formulario.data_lancamento.value = livro.data_lancamento || livro.data_cadastro || '';
        this.formulario.data_cadastro.value = livro.data_cadastro || '';
    }

    async salvar(evento) {
        evento.preventDefault();
        if (!this.formulario) return;

        const botao = this.formulario.querySelector('button[type="submit"]');
        if (!botao) return;

        const livro = {
            titulo: this.formulario.titulo.value,
            autor: this.formulario.autor.value,
            genero: this.formulario.genero.value,
            paginas: this.formulario.paginas.value,
            data_lancamento: this.formulario.data_lancamento.value,
            data_cadastro: this.formulario.data_cadastro.value
        };

        if (!livro.titulo || !livro.autor || !livro.genero || !livro.paginas || !livro.data_lancamento || !livro.data_cadastro) {
            this.exibirMensagem('Preencha todos os campos para continuar.', 'erro');
            return;
        }

        botao.disabled = true;
        this.exibirMensagem('Salvando...');

        try {
            let salvo;
            if (this.livroEditandoId) {
                salvo = await this.api.atualizarLivro(this.livroEditandoId, livro);
                this.exibirMensagem(`Livro "${salvo.titulo}" atualizado.`, 'sucesso');
            } else {
                salvo = await this.api.cadastrarLivro(livro);
                this.exibirMensagem(`Livro "${salvo.titulo}" cadastrado com sucesso.`, 'sucesso');
            }

            this.formulario.reset();
            this.fecharModal();
            await this.carregarLivros();
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        } finally {
            if (botao) botao.disabled = false;
        }
    }

    async excluirLivro(livro) {
        if (!livro || !livro.id_livro) return;
        if (!window.confirm(`Excluir "${livro.titulo}" do acervo?`)) return;
        try {
            const removido = await this.api.excluirLivro(livro.id_livro);
            if (removido) {
                this.exibirMensagem(`Livro "${removido.titulo}" removido.`, 'sucesso');
                await this.carregarLivros();
            }
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
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
