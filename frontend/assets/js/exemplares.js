/* Tela de exemplares.
 *
 * O JavaScript cuida só da tela: tema, catálogo, popups e envio do que o
 * usuário escolheu. Validação, busca, ids e status são feitos pelo back-end
 * em Python. */

/* Como cada status aparece na tela. */
const ROTULOS_STATUS = { DISPONIVEL: 'DISPONÍVEL', EMPRESTADO: 'EMPRESTADO' };

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
        this.campoQuantidade = document.getElementById('campoQuantidade');
        this.inputQuantidade = document.getElementById('quantidade');
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
        this.exemplarEditandoId = null;
        this.exemplarExcluindo = null;
        this.esperaBusca = null;
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
            // Espera o usuário parar de digitar antes de pedir ao servidor.
            this.searchInput.addEventListener('input', () => {
                clearTimeout(this.esperaBusca);
                this.esperaBusca = setTimeout(() => this.carregarExemplares(), 300);
            });
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

    /* Livros para o select do formulário e a lista de exemplares. */
    async carregarDados() {
        try {
            this.livros = await this.api.listarLivros();
            this.popularSelectLivros();
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
        await this.carregarExemplares();
    }

    /* Pede ao servidor os exemplares, já com o título do livro; a busca é feita no Python. */
    async carregarExemplares() {
        try {
            const busca = this.searchInput ? this.searchInput.value : '';
            const exemplares = await this.api.listarExemplares({ busca });
            this.desenharCatalogo(exemplares);
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
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

    desenharCatalogo(exemplares) {
        if (!this.catalogList) return;

        this.catalogList.replaceChildren();

        if (!exemplares || exemplares.length === 0) {
            this.exibirMensagem('Nenhum exemplar encontrado.', 'erro');
            return;
        }

        // Calcula quantos exemplares no total e quantos disponíveis por livro
        const contagemPorLivro = {};
        for (const ex of exemplares) {
            const idLivro = ex.id_livro;
            if (!contagemPorLivro[idLivro]) {
                contagemPorLivro[idLivro] = { total: 0, disponiveis: 0 };
            }
            contagemPorLivro[idLivro].total += 1;
            if (ex.status === 'DISPONIVEL') {
                contagemPorLivro[idLivro].disponiveis += 1;
            }
        }

        this.exibirMensagem('');
        for (const exemplar of exemplares) {
            const livro = Array.isArray(this.livros)
                ? this.livros.find((item) => Number(item.id_livro) === Number(exemplar.id_livro))
                : null;
            const autorFormatado = livro ? formatarListaTruncada(livro.autor, formatarNomeABNT) : '';
            const stats = contagemPorLivro[exemplar.id_livro] || { total: 0, disponiveis: 0 };

            const card = document.createElement('article');
            card.className = 'catalog-item exemplar-card';

            const titulo = document.createElement('div');
            titulo.className = 'book-title';
            titulo.textContent = exemplar.titulo_livro || 'Livro desconhecido';

            const contagemSpan = document.createElement('span');
            contagemSpan.className = 'exemplar-disponiveis-tag';
            contagemSpan.textContent = `${stats.disponiveis} de ${stats.total} disponíveis`;

            const tituloContainer = document.createElement('div');
            tituloContainer.className = 'exemplar-title-block';
            tituloContainer.append(titulo, contagemSpan);

            const status = document.createElement('span');
            status.className = exemplar.status === 'DISPONIVEL' ? 'exemplar-status disponivel' : 'exemplar-status emprestado';
            status.textContent = this.rotuloStatus(exemplar.status);

            const info = document.createElement('div');
            info.className = 'book-author';
            info.textContent = autorFormatado
                ? `${autorFormatado} • Código: ${exemplar.id_exemplar}`
                : `Código: ${exemplar.id_exemplar}`;

            const actions = document.createElement('div');
            actions.className = 'book-actions';

            const view = this.criarBotaoAcao('👁', 'Ver exemplar', 'view');
            const edit = this.criarBotaoAcao('✎', 'Editar exemplar', 'edit');
            const del = this.criarBotaoAcao('×', 'Excluir exemplar', 'delete');

            view.addEventListener('click', () => this.visualizarExemplar(exemplar));
            edit.addEventListener('click', () => this.editarExemplar(exemplar));
            del.addEventListener('click', () => this.excluirExemplar(exemplar));

            actions.append(view, edit, del);
            card.append(tituloContainer, status, info, actions);
            this.catalogList.appendChild(card);
        }
    }

    rotuloStatus(status) {
        return ROTULOS_STATUS[status] || status || 'SEM STATUS';
    }

    criarBotaoAcao(icone, titulo, tipo) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = tipo === 'delete' ? 'icon-button delete' : 'icon-button';
        btn.title = titulo;
        btn.textContent = icone;
        return btn;
    }

    visualizarExemplar(exemplar) {
        if (!exemplar) return;

        const livro = Array.isArray(this.livros)
            ? this.livros.find((item) => Number(item.id_livro) === Number(exemplar.id_livro))
            : null;

        if (this.viewExemplarTitle) {
            this.viewExemplarTitle.textContent = exemplar.titulo_livro || 'Livro desconhecido';
        }

        if (this.viewExemplarAutor) {
            if (livro && livro.autor) {
                const autoresLista = livro.autor.split('; ').map(s => s.trim()).filter(Boolean);
                const autoresABNT = autoresLista.map(formatarNomeABNT).join('; ');
                this.viewExemplarAutor.textContent = autoresABNT || 'Autor desconhecido';
            } else {
                this.viewExemplarAutor.textContent = 'Autor desconhecido';
            }
        }

        if (this.viewExemplarStatus) {
            this.viewExemplarStatus.textContent = this.rotuloStatus(exemplar.status);
        }

        if (this.viewExemplarCodigo) {
            this.viewExemplarCodigo.textContent = exemplar.id_exemplar;
        }

        if (this.viewExemplarGenero) {
            if (livro && livro.genero) {
                const generosLista = livro.genero.split('; ').map(s => s.trim()).filter(Boolean);
                this.viewExemplarGenero.textContent = generosLista.join(', ') || 'Gênero não informado';
            } else {
                this.viewExemplarGenero.textContent = 'Gênero não informado';
            }
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
        if (this.inputQuantidade) this.inputQuantidade.value = 1;
        if (this.campoQuantidade) this.campoQuantidade.style.display = '';
        this.modalTitle.textContent = 'Cadastrar exemplar';
        this.formulario.querySelector('button[type="submit"]').textContent = 'Cadastrar exemplar';
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
        this.formulario.livroSelect.value = String(exemplar.id_livro);
        if (this.campoQuantidade) this.campoQuantidade.style.display = 'none';

        if (this.modalCadastro) {
            this.modalCadastro.classList.add('open');
        }
    }

    /* Envia o livro escolhido; quem valida e define o status é o servidor. */
    async salvar(evento) {
        evento.preventDefault();
        if (!this.formulario) return;

        const botao = this.formulario.querySelector('button[type="submit"]');
        const idLivro = this.formulario.livroSelect.value;
        const quantidade = this.inputQuantidade ? Math.max(1, parseInt(this.inputQuantidade.value, 10) || 1) : 1;
        const editando = this.exemplarEditandoId;

        const livro = Array.isArray(this.livros)
            ? this.livros.find((l) => Number(l.id_livro) === Number(idLivro))
            : null;
        const tituloLivro = livro ? livro.titulo : '';

        botao.disabled = true;
        this.exibirMensagem('Salvando...');

        try {
            if (editando) {
                const salvo = await this.api.atualizarExemplar(editando, { id_livro: idLivro });
                this.fecharModalCadastro();
                await this.carregarExemplares();
                this.exibirMensagem(`Exemplar do livro "${salvo.titulo_livro || tituloLivro}" atualizado.`, 'sucesso');
            } else if (quantidade > 1) {
                const requisicoes = [];
                for (let i = 0; i < quantidade; i++) {
                    requisicoes.push(this.api.cadastrarExemplar({ id_livro: idLivro }));
                }
                await Promise.all(requisicoes);

                this.fecharModalCadastro();
                await this.carregarExemplares();
                this.exibirMensagem(`${quantidade} exemplares de "${tituloLivro}" cadastrados com sucesso.`, 'sucesso');
            } else {
                const salvo = await this.api.cadastrarExemplar({ id_livro: idLivro });

                this.fecharModalCadastro();
                await this.carregarExemplares();
                this.exibirMensagem(`Exemplar de "${salvo.titulo_livro || tituloLivro}" cadastrado com sucesso.`, 'sucesso');
            }
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        } finally {
            botao.disabled = false;
        }
    }

    excluirExemplar(exemplar) {
        if (!exemplar || !exemplar.id_exemplar) return;

        this.exemplarExcluindo = exemplar;
        this.confirmText.textContent = `Deseja excluir o exemplar do livro "${exemplar.titulo_livro || 'Livro'}"?`;

        if (this.modalConfirmacao) {
            this.modalConfirmacao.classList.add('open');
        }
    }

    async confirmarExclusao() {
        if (!this.exemplarExcluindo) return;

        try {
            await this.api.excluirExemplar(this.exemplarExcluindo.id_exemplar);
            this.fecharModalConfirmacao();
            await this.carregarExemplares();
            this.exibirMensagem('Exemplar removido.', 'sucesso');
        } catch (erro) {
            // O popup não tem espaço para mensagem: fecha e mostra o motivo na tela.
            this.fecharModalConfirmacao();
            this.exibirMensagem(erro.message, 'erro');
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
    if (!document.getElementById('formulario-exemplar')) return;
    new TelaExemplares(new Api()).iniciar();
});
