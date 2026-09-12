class TelaExemplares {
    constructor(api) {
        this.api = api;
        this.mensagem = document.getElementById('mensagem');
        this.mensagemFormulario = document.getElementById('mensagem-formulario');
        this.catalogList = document.getElementById('catalogList');
        this.formulario = document.getElementById('formulario-exemplar');
        this.modalCadastro = document.getElementById('modalCadastro');
        this.modalConfirmacao = document.getElementById('modalConfirmacao');
        this.modalTitle = document.getElementById('modalTitle');
        this.closeCadastro = document.getElementById('closeCadastro');
        this.cancelForm = document.getElementById('cancelForm');
        this.openForm = document.getElementById('openForm');
        this.searchInput = document.getElementById('searchInput');
        this.themeToggle = document.getElementById('themeToggle');
        this.livroSelect = document.getElementById('livroSelect');
        this.quantidadeInput = document.getElementById('quantidade');
        this.closeConfirmacao = document.getElementById('closeConfirmacao');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.confirmDelete = document.getElementById('confirmDelete');
        this.confirmText = document.getElementById('confirmText');
        this.viewBackdropExemplar = document.getElementById('viewBackdropExemplar');
        this.closeViewExemplar = document.getElementById('closeViewExemplar');
        this.closeViewBookExemplar = document.getElementById('closeViewBookExemplar');
        this.viewExemplarTitle = document.getElementById('viewExemplarTitle');
        this.viewExemplarAutor = document.getElementById('viewExemplarAutor');
        this.viewExemplarStatus = document.getElementById('viewExemplarStatus');
        this.viewExemplarCodigo = document.getElementById('viewExemplarCodigo');
        this.viewExemplarGenero = document.getElementById('viewExemplarGenero');
        this.livros = [];
        this.exemplares = [];
        this.exemplarEditandoId = null;
        this.exemplarExcluindo = null;
        this.toastTimer = null;
        this.toastHideTimer = null;
    }

    iniciar() {
        this.aplicarTemaSalvo();
        this.configurarTema();
        this.configurarCatalogo();
        this.configurarCadastro();
        this.configurarExclusao();
        this.carregarDados();
    }

    aplicarTemaSalvo() {
        const saved = document.documentElement.dataset.theme || localStorage.getItem('biblioteca-theme') || 'light';
        const tema = saved === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.theme = tema;
        this.atualizarTemaVisual(tema);
    }

    configurarTema() {
        if (!this.themeToggle) return;

        this.themeToggle.addEventListener('click', () => {
            const proximoTema = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
            document.documentElement.dataset.theme = proximoTema;
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
    }

    configurarCadastro() {
        if (!this.formulario) return;

        this.formulario.addEventListener('submit', (evento) => this.salvar(evento));

        if (this.closeCadastro) {
            this.closeCadastro.addEventListener('click', () => this.fecharModalCadastro());
        }

        if (this.cancelForm) {
            this.cancelForm.addEventListener('click', () => this.fecharModalCadastro());
        }

        if (this.modalCadastro) {
            this.modalCadastro.addEventListener('click', (evento) => {
                if (evento.target === this.modalCadastro) {
                    this.fecharModalCadastro();
                }
            });
        }

        if (this.closeViewExemplar) {
            this.closeViewExemplar.addEventListener('click', () => this.fecharVisualizacaoExemplar());
        }

        if (this.closeViewBookExemplar) {
            this.closeViewBookExemplar.addEventListener('click', () => this.fecharVisualizacaoExemplar());
        }

        if (this.viewBackdropExemplar) {
            this.viewBackdropExemplar.addEventListener('click', (evento) => {
                if (evento.target === this.viewBackdropExemplar) {
                    this.fecharVisualizacaoExemplar();
                }
            });
        }
    }

    configurarExclusao() {
        if (this.closeConfirmacao) {
            this.closeConfirmacao.addEventListener('click', () => this.fecharModalConfirmacao());
        }

        if (this.cancelDelete) {
            this.cancelDelete.addEventListener('click', () => this.fecharModalConfirmacao());
        }

        if (this.modalConfirmacao) {
            this.modalConfirmacao.addEventListener('click', (evento) => {
                if (evento.target === this.modalConfirmacao) {
                    this.fecharModalConfirmacao();
                }
            });
        }

        if (this.confirmDelete) {
            this.confirmDelete.addEventListener('click', () => this.confirmarExclusao());
        }
    }

    async carregarDados() {
        try {
            this.livros = await this.api.listarLivros();
            this.exemplares = this.getMockExemplares();
            this.popularSelectLivros();
            this.aplicarFiltros();
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    getMockExemplares() {
        const livro1 = this.livros.find((livro) => Number(livro.id_livro) === 1);
        const livro2 = this.livros.find((livro) => Number(livro.id_livro) === 2);
        const livro3 = this.livros.find((livro) => Number(livro.id_livro) === 3);
        const livro4 = this.livros.find((livro) => Number(livro.id_livro) === 4);

        return [
            { id_exemplar: 1, id_livro: livro1 ? livro1.id_livro : 1, codigo: 'EX-001', status: 'DISPONÍVEL' },
            { id_exemplar: 2, id_livro: livro2 ? livro2.id_livro : 2, codigo: 'EX-002', status: 'EMPRESTADO' },
            { id_exemplar: 3, id_livro: livro3 ? livro3.id_livro : 3, codigo: 'EX-003', status: 'DISPONÍVEL' },
            { id_exemplar: 4, id_livro: livro4 ? livro4.id_livro : 4, codigo: 'EX-004', status: 'EMPRESTADO' }
        ];
    }

    popularSelectLivros() {
        if (!this.livroSelect || !Array.isArray(this.livros)) return;

        this.livroSelect.replaceChildren();
        const vazio = new Option('Selecione um livro', '');
        this.livroSelect.appendChild(vazio);

        for (const livro of this.livros) {
            const option = new Option(livro.titulo, String(livro.id_livro));
            this.livroSelect.appendChild(option);
        }
    }

    aplicarFiltros() {
        if (!Array.isArray(this.exemplares)) return;

        const busca = (this.searchInput ? this.searchInput.value.trim().toLowerCase() : '');

        let lista = this.exemplares.filter((exemplar) => {
            const livro = this.livros.find((item) => Number(item.id_livro) === Number(exemplar.id_livro));
            const tituloLivro = livro ? livro.titulo : exemplar.livro || '';
            const atendeBusca = !busca || tituloLivro.toLowerCase().includes(busca);
            return atendeBusca;
        });

        this.desenharCatalogo(lista);
    }

    desenharCatalogo(exemplares) {
        if (!this.catalogList) return;

        this.catalogList.replaceChildren();

        if (!exemplares || exemplares.length === 0) {
            this.exibirMensagem('Nenhum exemplar encontrado.', 'erro');
            return;
        }

        for (const exemplar of exemplares) {
            const livro = this.livros.find((item) => Number(item.id_livro) === Number(exemplar.id_livro));
            const card = document.createElement('article');
            card.className = 'catalog-item exemplar-card';

            const titulo = document.createElement('div');
            titulo.className = 'book-title';
            titulo.textContent = livro ? livro.titulo : exemplar.livro || 'Livro desconhecido';

            const status = document.createElement('span');
            status.className = exemplar.status === 'DISPONÍVEL' ? 'exemplar-status disponivel' : 'exemplar-status emprestado';
            status.textContent = exemplar.status;

            const info = document.createElement('div');
            info.className = 'book-author';
            info.textContent = `Código: ${exemplar.id_exemplar}`;

            const actions = document.createElement('div');
            actions.className = 'book-actions';

            const view = this.criarBotaoAcao('👁', 'Ver exemplar', 'view');
            const edit = this.criarBotaoAcao('✎', 'Editar exemplar', 'edit');
            const del = this.criarBotaoAcao('×', 'Excluir exemplar', 'delete');

            view.addEventListener('click', () => this.visualizarExemplar(exemplar));
            edit.addEventListener('click', () => this.editarExemplar(exemplar));
            del.addEventListener('click', () => this.excluirExemplar(exemplar));

            actions.append(view, edit, del);
            card.append(titulo, status, info, actions);
            this.catalogList.appendChild(card);
        }
    }

    criarBotaoAcao(icone, titulo, tipo) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = tipo === 'delete' ? 'icon-button delete' : 'icon-button';
        btn.title = titulo;
        btn.innerHTML = icone;
        return btn;
    }

    visualizarExemplar(exemplar) {
        if (!exemplar) return;

        const livro = this.livros.find((item) => Number(item.id_livro) === Number(exemplar.id_livro));
        if (this.viewExemplarTitle) {
            this.viewExemplarTitle.textContent = livro ? livro.titulo : exemplar.livro || 'Livro desconhecido';
        }
        if (this.viewExemplarAutor) {
            this.viewExemplarAutor.textContent = livro ? livro.autor || 'Autor desconhecido' : 'Autor desconhecido';
        }
        if (this.viewExemplarStatus) {
            this.viewExemplarStatus.textContent = exemplar.status || 'SEM STATUS';
        }
        if (this.viewExemplarCodigo) {
            this.viewExemplarCodigo.textContent = exemplar.id_exemplar || 'Sem código';
        }
        if (this.viewExemplarGenero) {
            this.viewExemplarGenero.textContent = livro ? livro.genero || 'Gênero não informado' : 'Gênero não informado';
        }

        if (this.modalCadastro) {
            this.modalCadastro.classList.remove('open');
        }
        if (this.viewBackdropExemplar) {
            this.viewBackdropExemplar.classList.add('open');
        }
    }

    fecharVisualizacaoExemplar() {
        if (this.viewBackdropExemplar) {
            this.viewBackdropExemplar.classList.remove('open');
        }
    }

    abrirModalCadastro() {
        this.exemplarEditandoId = null;
        this.formulario.reset();
        this.modalTitle.textContent = 'Cadastrar exemplar';
        this.formulario.querySelector('button[type="submit"]').textContent = 'Cadastrar exemplar';
        if (this.formulario.quantidade) {
            this.formulario.quantidade.value = 1;
        }
        this.popularSelectLivros();
        if (this.modalCadastro) {
            this.modalCadastro.classList.add('open');
        }
    }

    fecharModalCadastro() {
        if (this.modalCadastro) {
            this.modalCadastro.classList.remove('open');
        }

        if (this.formulario) {
            this.formulario.reset();
        }

        this.exemplarEditandoId = null;
    }

    editarExemplar(exemplar) {
        this.exemplarEditandoId = exemplar.id_exemplar;
        this.modalTitle.textContent = 'Editar exemplar';
        this.formulario.querySelector('button[type="submit"]').textContent = 'Salvar exemplar';
        this.popularSelectLivros();
        if (this.formulario) {
            this.formulario.livroSelect.value = String(exemplar.id_livro);
            this.formulario.quantidade.value = 1;
        }

        if (this.modalCadastro) {
            this.modalCadastro.classList.add('open');
        }
    }

    async salvar(evento) {
        evento.preventDefault();
        if (!this.formulario) return;

        const botao = this.formulario.querySelector('button[type="submit"]');
        if (!botao) return;

        const livroId = this.formulario.livroSelect.value;
        const quantidade = Number(this.formulario.quantidade.value);

        if (!livroId || !Number.isFinite(quantidade) || quantidade < 1) {
            this.exibirMensagem('Selecione um livro e informe uma quantidade válida.', 'erro');
            return;
        }

        const livro = this.livros.find((item) => Number(item.id_livro) === Number(livroId));
        if (!livro) {
            this.exibirMensagem('Livro inválido.', 'erro');
            return;
        }

        botao.disabled = true;
        this.exibirMensagem('Salvando...');

        try {
            let salvo;
            let textoSucesso = '';

            if (this.exemplarEditandoId) {
                const alvo = this.exemplares.find((item) => Number(item.id_exemplar) === Number(this.exemplarEditandoId));
                if (alvo) {
                    alvo.id_livro = Number(livroId);
                    alvo.status = 'DISPONÍVEL';
                    alvo.livro = livro.titulo;
                    alvo.codigo = this.gerarCodigoExemplar(Number(alvo.id_exemplar));
                    salvo = { ...alvo };
                    textoSucesso = `Exemplar do livro "${livro.titulo}" atualizado.`;
                }
            } else {
                const novos = [];
                for (let i = 0; i < quantidade; i += 1) {
                    const idExemplar = this.proximoCodigoExemplar();
                    const novo = {
                        id_exemplar: idExemplar,
                        id_livro: Number(livroId),
                        codigo: this.gerarCodigoExemplar(idExemplar),
                        livro: livro.titulo,
                        status: 'DISPONÍVEL'
                    };
                    novos.push(novo);
                }

                this.exemplares.push(...novos);
                salvo = novos[0] ? { ...novos[0] } : null;
                textoSucesso = `${quantidade} exemplar(es) do livro "${livro.titulo}" cadastrado(s) com sucesso.`;
            }

            this.formulario.reset();
            this.fecharModalCadastro();
            this.aplicarFiltros();
            this.exibirMensagem(textoSucesso, 'sucesso');
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        } finally {
            if (botao) botao.disabled = false;
        }
    }

    proximoCodigoExemplar() {
        const maior = this.exemplares.reduce((maiorId, exemplar) => Math.max(maiorId, Number(exemplar.id_exemplar) || 0), 0);
        return maior + 1;
    }

    gerarCodigoExemplar(idExemplar) {
        return `EX-${String(Number(idExemplar)).padStart(3, '0')}`;
    }

    excluirExemplar(exemplar) {
        if (!exemplar || !exemplar.id_exemplar) return;

        this.exemplarExcluindo = exemplar;
        this.confirmText.textContent = `Deseja excluir o exemplar do livro "${exemplar.livro || 'Livro'}"?`;

        if (this.modalConfirmacao) {
            this.modalConfirmacao.classList.add('open');
        }
    }

    confirmarExclusao() {
        if (!this.exemplarExcluindo || !this.exemplarExcluindo.id_exemplar) return;

        const indice = this.exemplares.findIndex((item) => Number(item.id_exemplar) === Number(this.exemplarExcluindo.id_exemplar));
        if (indice >= 0) {
            this.exemplares.splice(indice, 1);
            this.exibirMensagem('Exemplar removido.', 'sucesso');
            this.fecharModalConfirmacao();
            this.aplicarFiltros();
        }
    }

    fecharModalConfirmacao() {
        if (this.modalConfirmacao) {
            this.modalConfirmacao.classList.remove('open');
        }
        this.exemplarExcluindo = null;
    }

    exibirMensagem(texto, tipo = '') {
        const classe = tipo ? `mensagem ${tipo}` : 'mensagem';

        if (this.mensagem) {
            this.mensagem.textContent = texto;
            this.mensagem.className = classe;
            this.mensagem.setAttribute('role', 'status');
            this.mensagem.setAttribute('aria-live', 'polite');

            if (tipo === 'sucesso') {
                this.mensagem.classList.add('toast-visible');
                clearTimeout(this.toastTimer);
                clearTimeout(this.toastHideTimer);

                this.toastTimer = setTimeout(() => {
                    this.mensagem.classList.add('toast-leaving');
                    this.mensagem.classList.remove('toast-visible');
                }, 2600);

                this.toastHideTimer = setTimeout(() => {
                    this.mensagem.classList.remove('toast-visible', 'toast-leaving');
                    this.mensagem.textContent = '';
                    this.mensagem.className = 'mensagem';
                }, 3400);
            } else {
                this.mensagem.classList.remove('toast-visible', 'toast-leaving');
                clearTimeout(this.toastTimer);
                clearTimeout(this.toastHideTimer);
            }
        }

        if (this.mensagemFormulario) {
            this.mensagemFormulario.textContent = texto;
            this.mensagemFormulario.className = classe;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('formulario-exemplar') || !document.getElementById('modalCadastro') || !document.getElementById('viewBackdropExemplar')) return;
    new TelaExemplares(new Api()).iniciar();
});
