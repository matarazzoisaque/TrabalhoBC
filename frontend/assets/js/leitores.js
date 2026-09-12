class TelaLeitores {
    constructor(api) {
        this.api = api;
        this.mensagem = document.getElementById('mensagem');
        this.mensagemFormulario = document.getElementById('mensagem-formulario');
        this.catalogList = document.getElementById('catalogList');
        this.formulario = document.getElementById('formulario-leitor');
        this.modalCadastro = document.getElementById('modalCadastro');
        this.modalVisualizacao = document.getElementById('modalVisualizacao');
        this.modalConfirmacao = document.getElementById('modalConfirmacao');
        this.modalTitle = document.getElementById('modalTitle');
        this.closeCadastro = document.getElementById('closeCadastro');
        this.cancelForm = document.getElementById('cancelForm');
        this.openForm = document.getElementById('openForm');
        this.searchInput = document.getElementById('searchInput');
        this.themeToggle = document.getElementById('themeToggle');
        this.visualizarTitle = document.getElementById('visualizarTitle');
        this.visualizarSubtitle = document.getElementById('visualizarSubtitle');
        this.viewLeitorNome = document.getElementById('viewLeitorNome');
        this.viewLeitorEmail = document.getElementById('viewLeitorEmail');
        this.viewLeitorTelefone = document.getElementById('viewLeitorTelefone');
        this.viewLeitorDataCadastro = document.getElementById('viewLeitorDataCadastro');
        this.fecharVisualizacao = document.getElementById('fecharVisualizacao');
        this.closeVisualizacao = document.getElementById('closeVisualizacao');
        this.closeConfirmacao = document.getElementById('closeConfirmacao');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.confirmDelete = document.getElementById('confirmDelete');
        this.confirmText = document.getElementById('confirmText');
        this.leitores = [];
        this.leitorEditandoId = null;
        this.leitorExcluindo = null;
        this.toastTimer = null;
        this.toastHideTimer = null;
    }

    iniciar() {
        this.aplicarTemaSalvo();
        this.configurarTema();
        this.configurarCatalogo();
        this.configurarCadastro();
        this.configurarVisualizacao();
        this.configurarExclusao();
        this.carregarLeitores();
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
    }

    configurarVisualizacao() {
        if (this.closeVisualizacao) {
            this.closeVisualizacao.addEventListener('click', () => this.fecharModalVisualizacao());
        }

        if (this.fecharVisualizacao) {
            this.fecharVisualizacao.addEventListener('click', () => this.fecharModalVisualizacao());
        }

        if (this.modalVisualizacao) {
            this.modalVisualizacao.addEventListener('click', (evento) => {
                if (evento.target === this.modalVisualizacao) {
                    this.fecharModalVisualizacao();
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

    async carregarLeitores() {
        try {
            this.leitores = await this.api.listarLeitores();
            this.aplicarFiltros();
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    aplicarFiltros() {
        if (!Array.isArray(this.leitores)) return;

        const busca = (this.searchInput ? this.searchInput.value.trim().toLowerCase() : '');

        let lista = this.leitores.filter((leitor) => {
            const buscaTexto = `${leitor.nome} ${leitor.email}`.toLowerCase();
            const atendeBusca = !busca || buscaTexto.includes(busca);
            return atendeBusca;
        });

        this.desenharCatalogo(lista);
    }

    desenharCatalogo(leitores) {
        if (!this.catalogList) return;

        this.catalogList.replaceChildren();

        if (!leitores || leitores.length === 0) {
            this.exibirMensagem('Nenhum leitor encontrado.', 'erro');
            return;
        }

        for (const leitor of leitores) {
            const item = this.criarItem(leitor);
            this.catalogList.appendChild(item);
        }
    }

    criarItem(leitor) {
        const item = document.createElement('article');
        item.className = 'catalog-item leitor-item';

        const esquerda = document.createElement('div');
        esquerda.className = 'book-main';

        const titulo = document.createElement('div');
        titulo.className = 'book-title';
        titulo.textContent = leitor.nome || 'Leitor';

        const email = document.createElement('div');
        email.className = 'book-author';
        email.textContent = leitor.email || 'E-mail não informado';

        esquerda.append(titulo, email);

        const telefone = document.createElement('div');
        telefone.className = 'book-meta-column';
        telefone.innerHTML = `<span class="book-label">TELEFONE</span><span class="book-value">${leitor.telefone || 'Sem telefone'}</span>`;

        const cadastro = document.createElement('div');
        cadastro.className = 'book-meta-column';
        cadastro.innerHTML = `<span class="book-label">DATA DE CADASTRO</span><span class="book-value">${this.formatarData(leitor.data_cadastro)}</span>`;

        const actions = document.createElement('div');
        actions.className = 'book-actions';

        const view = this.criarBotaoAcao('👁', 'Ver leitor', 'view');
        const edit = this.criarBotaoAcao('✎', 'Editar leitor', 'edit');
        const del = this.criarBotaoAcao('×', 'Excluir leitor', 'delete');

        view.addEventListener('click', () => this.visualizarLeitor(leitor));
        edit.addEventListener('click', () => this.editarLeitor(leitor));
        del.addEventListener('click', () => this.excluirLeitor(leitor));

        actions.append(view, edit, del);
        item.append(esquerda, telefone, cadastro, actions);
        return item;
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
        this.leitorEditandoId = null;
        this.modalTitle.textContent = 'Cadastrar leitor';
        this.formulario.reset();
        this.formulario.data_cadastro.value = new Date().toISOString().slice(0, 10);
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

        this.leitorEditandoId = null;
    }

    visualizarLeitor(leitor) {
        if (!this.modalVisualizacao) return;

        if (this.visualizarTitle) {
            this.visualizarTitle.textContent = leitor.nome || 'Leitor';
        }

        if (this.visualizarSubtitle) {
            this.visualizarSubtitle.textContent = leitor.email || 'E-mail não informado';
        }

        if (this.viewLeitorNome) {
            this.viewLeitorNome.textContent = leitor.nome || 'Não informado';
        }
        if (this.viewLeitorEmail) {
            this.viewLeitorEmail.textContent = leitor.email || 'Não informado';
        }
        if (this.viewLeitorTelefone) {
            this.viewLeitorTelefone.textContent = leitor.telefone || 'Não informado';
        }
        if (this.viewLeitorDataCadastro) {
            this.viewLeitorDataCadastro.textContent = this.formatarData(leitor.data_cadastro);
        }

        this.modalVisualizacao.classList.add('open');
    }

    fecharModalVisualizacao() {
        if (this.modalVisualizacao) {
            this.modalVisualizacao.classList.remove('open');
        }
    }

    editarLeitor(leitor) {
        this.leitorEditandoId = leitor.id_leitor;
        this.modalTitle.textContent = 'Editar leitor';
        this.preencherFormulario(leitor);
        if (this.modalCadastro) {
            this.modalCadastro.classList.add('open');
        }
    }

    preencherFormulario(leitor) {
        if (!this.formulario) return;
        this.formulario.nome.value = leitor.nome || '';
        this.formulario.email.value = leitor.email || '';
        this.formulario.telefone.value = leitor.telefone || '';
        this.formulario.data_cadastro.value = leitor.data_cadastro || new Date().toISOString().slice(0, 10);
    }

    async salvar(evento) {
        evento.preventDefault();
        if (!this.formulario) return;

        const botao = this.formulario.querySelector('button[type="submit"]');
        if (!botao) return;

        const leitor = {
            nome: this.formulario.nome.value.trim(),
            email: this.formulario.email.value.trim(),
            telefone: this.formulario.telefone.value.trim(),
            data_cadastro: this.formulario.data_cadastro.value
        };

        if (!leitor.nome || !leitor.telefone || !leitor.email || !this.validarEmail(leitor.email)) {
            this.exibirMensagem('Preencha nome, e-mail válido e telefone para continuar.', 'erro');
            return;
        }

        botao.disabled = true;
        this.exibirMensagem('Salvando...');

        try {
            let salvo;
            let textoSucesso = '';

            if (this.leitorEditandoId) {
                salvo = await this.api.atualizarLeitor(this.leitorEditandoId, leitor);
                textoSucesso = `Leitor "${salvo.nome}" atualizado.`;
            } else {
                salvo = await this.api.cadastrarLeitor(leitor);
                textoSucesso = `Leitor "${salvo.nome}" cadastrado com sucesso.`;
            }

            this.formulario.reset();
            this.fecharModalCadastro();
            await this.carregarLeitores();
            this.exibirMensagem(textoSucesso, 'sucesso');
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        } finally {
            if (botao) botao.disabled = false;
        }
    }

    validarEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async excluirLeitor(leitor) {
        if (!leitor || !leitor.id_leitor) return;

        this.leitorExcluindo = leitor;
        this.confirmText.textContent = `Deseja excluir o leitor "${leitor.nome}"?`;

        if (this.modalConfirmacao) {
            this.modalConfirmacao.classList.add('open');
        }
    }

    async confirmarExclusao() {
        if (!this.leitorExcluindo || !this.leitorExcluindo.id_leitor) return;

        try {
            const removido = await this.api.excluirLeitor(this.leitorExcluindo.id_leitor);
            if (removido) {
                this.exibirMensagem(`Leitor "${removido.nome}" removido.`, 'sucesso');
                this.fecharModalConfirmacao();
                await this.carregarLeitores();
            }
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    fecharModalConfirmacao() {
        if (this.modalConfirmacao) {
            this.modalConfirmacao.classList.remove('open');
        }
        this.leitorExcluindo = null;
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

document.addEventListener('DOMContentLoaded', () => {    if (!document.getElementById('formulario-leitor') || !document.getElementById('modalVisualizacao') || !document.getElementById('modalConfirmacao')) return;    new TelaLeitores(new DadosSimulados()).iniciar();
});
