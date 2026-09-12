class TelaEmprestimos {
    constructor(api) {
        this.api = api;
        this.mensagem = document.getElementById('mensagem');
        this.mensagemFormulario = document.getElementById('mensagem-formulario');
        this.catalogList = document.getElementById('catalogList');
        this.formulario = document.getElementById('formulario-emprestimo');
        this.modalCadastro = document.getElementById('modalCadastro');
        this.modalConfirmacao = document.getElementById('modalConfirmacao');
        this.modalTitle = document.getElementById('modalTitle');
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmText = document.getElementById('confirmText');
        this.confirmLivro = document.getElementById('confirmLivro');
        this.confirmLeitor = document.getElementById('confirmLeitor');
        this.closeCadastro = document.getElementById('closeCadastro');
        this.closeConfirmacao = document.getElementById('closeConfirmacao');
        this.cancelForm = document.getElementById('cancelForm');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.confirmDelete = document.getElementById('confirmDelete');
        this.openForm = document.getElementById('openForm');
        this.searchInput = document.getElementById('searchInput');
        this.themeToggle = document.getElementById('themeToggle');
        this.leitorSelect = document.getElementById('leitorSelect');
        this.exemplarSelect = document.getElementById('exemplarSelect');
        this.dataEmprestimo = document.getElementById('data_emprestimo');
        this.prazoDias = document.getElementById('prazo_dias');
        this.leitores = [];
        this.livros = [];
        this.exemplares = [];
        this.emprestimos = [];
        this.emprestimoConfirmando = null;
        this.toastTimer = null;
        this.toastHideTimer = null;
    }

    iniciar() {
        this.aplicarTemaSalvo();
        this.configurarTema();
        this.configurarCatalogo();
        this.configurarCadastro();
        this.configurarConfirmacaoDevolucao();
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
    }

    configurarConfirmacaoDevolucao() {
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
            this.confirmDelete.addEventListener('click', () => this.confirmarDevolucao());
        }
    }

    async carregarDados() {
        try {
            /*
             * Este mock de empréstimos precisa ser substituído pela API real
             * quando o backend de empréstimos existir. Ele depende dos mocks
             * compartilhados de leitores e exemplares em memória.
             */
            this.livros = await this.api.listarLivros();

            this.leitores = [
                { id_leitor: 1, nome: 'Ana Silva', email: 'ana.silva@email.com', telefone: '(11) 99999-1001', data_cadastro: '2026-09-01' },
                { id_leitor: 2, nome: 'Bruno Costa', email: 'bruno.costa@email.com', telefone: '(11) 99999-1002', data_cadastro: '2026-09-02' }
            ];

            this.exemplares = [
                { id_exemplar: 1, id_livro: 1, codigo: 'EX-001', status: 'DISPONÍVEL', localizacao: 'Prateleira A1' },
                { id_exemplar: 2, id_livro: 2, codigo: 'EX-002', status: 'EMPRESTADO', localizacao: 'Prateleira B2' },
                { id_exemplar: 3, id_livro: 3, codigo: 'EX-003', status: 'DISPONÍVEL', localizacao: 'Prateleira C1' }
            ];

            this.emprestimos = [
                { id_emprestimo: 1, id_leitor: 1, id_exemplar: 2, data_emprestimo: '2026-09-12', prazo_dias: 7, data_prevista_devolucao: '2026-09-19', situacao: 'ATIVO' },
                { id_emprestimo: 2, id_leitor: 2, id_exemplar: 3, data_emprestimo: '2026-09-10', prazo_dias: 14, data_prevista_devolucao: '2026-09-24', situacao: 'DEVOLVIDO' }
            ];

            this.popularSelectLeitores();
            this.popularSelectExemplares();
            this.aplicarFiltros();
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    popularSelectLeitores() {
        if (!this.leitorSelect) return;

        this.leitorSelect.replaceChildren();
        this.leitorSelect.appendChild(new Option('Selecione um leitor', ''));

        for (const leitor of this.leitores) {
            this.leitorSelect.appendChild(new Option(leitor.nome, String(leitor.id_leitor)));
        }
    }

    popularSelectExemplares() {
        if (!this.exemplarSelect) return;

        this.exemplarSelect.replaceChildren();
        this.exemplarSelect.appendChild(new Option('Selecione um exemplar', ''));

        for (const exemplar of this.exemplares) {
            if (exemplar.status === 'DISPONÍVEL') {
                const livro = this.descreverLivro(exemplar.id_livro);
                this.exemplarSelect.appendChild(new Option(`${exemplar.codigo} — ${livro}`, String(exemplar.id_exemplar)));
            }
        }
    }

    descreverLivro(id_livro) {
        const livro = this.livros ? this.livros.find((item) => Number(item.id_livro) === Number(id_livro)) : null;
        return livro ? livro.titulo : 'Exemplar sem livro cadastrado';
    }

    aplicarFiltros() {
        if (!Array.isArray(this.emprestimos)) return;

        const busca = (this.searchInput ? this.searchInput.value.trim().toLowerCase() : '');

        const lista = this.emprestimos.filter((emprestimo) => {
            const leitor = this.leitores.find((item) => Number(item.id_leitor) === Number(emprestimo.id_leitor));
            const exemplar = this.exemplares.find((item) => Number(item.id_exemplar) === Number(emprestimo.id_exemplar));
            const livro = exemplar ? this.descreverLivro(exemplar.id_livro) : '';
            const buscaTexto = `${leitor ? leitor.nome : ''} ${livro}`.toLowerCase();
            return !busca || buscaTexto.includes(busca);
        });

        this.desenharCatalogo(lista);
    }

    desenharCatalogo(emprestimos) {
        if (!this.catalogList) return;

        this.catalogList.replaceChildren();

        if (!emprestimos || emprestimos.length === 0) {
            this.exibirMensagem('Nenhum empréstimo encontrado.', 'erro');
            return;
        }

        for (const emprestimo of emprestimos) {
            const item = document.createElement('article');
            item.className = 'catalog-item';

            const leitor = this.leitores.find((item) => Number(item.id_leitor) === Number(emprestimo.id_leitor));
            const exemplar = this.exemplares.find((item) => Number(item.id_exemplar) === Number(emprestimo.id_exemplar));
            const livro = exemplar ? this.descreverLivro(exemplar.id_livro) : 'Exemplar sem livro cadastrado';

            const colunaLeitor = document.createElement('div');
            colunaLeitor.className = 'book-meta-column';
            colunaLeitor.innerHTML = `<span class="book-label">LEITOR</span><span class="book-value">${leitor ? leitor.nome : 'Leitor não encontrado'}</span>`;

            const colunaLivro = document.createElement('div');
            colunaLivro.className = 'book-meta-column';
            colunaLivro.innerHTML = `<span class="book-label">LIVRO</span><span class="book-value">${livro}</span>`;

            const colunaData = document.createElement('div');
            colunaData.className = 'book-meta-column';
            colunaData.innerHTML = `<span class="book-label">DATA DO EMPRÉSTIMO</span><span class="book-value">${this.formatarData(emprestimo.data_emprestimo)}</span>`;

            const colunaPrevisao = document.createElement('div');
            colunaPrevisao.className = 'book-meta-column';
            colunaPrevisao.innerHTML = `<span class="book-label">PREVISÃO DE DEVOLUÇÃO</span><span class="book-value">${this.formatarData(emprestimo.data_prevista_devolucao || this.calcularDataPrevista(emprestimo.data_emprestimo, emprestimo.prazo_dias || 7))}</span>`;

            const colunaSituacao = document.createElement('div');
            colunaSituacao.className = 'book-meta-column';
            colunaSituacao.innerHTML = `<span class="book-label">SITUAÇÃO</span><span class="book-value">${emprestimo.situacao}</span>`;

            const actions = document.createElement('div');
            actions.className = 'book-actions';

            if (emprestimo.situacao === 'ATIVO') {
                const devolucao = this.criarBotaoAcao('↺', 'Registrar devolução', 'devolver');
                devolucao.addEventListener('click', () => this.abrirConfirmacaoDevolucao(emprestimo));
                actions.appendChild(devolucao);
            }

            item.append(colunaLeitor, colunaLivro, colunaData, colunaPrevisao, colunaSituacao, actions);
            this.catalogList.appendChild(item);
        }
    }

    criarBotaoAcao(icone, titulo, tipo) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = tipo === 'devolver' ? 'icon-button' : 'icon-button delete';
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
        this.formulario.reset();
        this.modalTitle.textContent = 'Novo empréstimo';
        this.formulario.data_emprestimo.value = new Date().toISOString().slice(0, 10);
        this.formulario.prazo_dias.value = 7;
        this.popularSelectLeitores();
        this.popularSelectExemplares();

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
    }

    async salvar(evento) {
        evento.preventDefault();
        if (!this.formulario) return;

        const leitorId = this.formulario.leitorSelect.value;
        const exemplarId = this.formulario.exemplarSelect.value;
        const dataEmprestimo = this.formulario.data_emprestimo.value;
        const prazoDias = Number(this.formulario.prazo_dias.value);

        if (!leitorId || !exemplarId || !dataEmprestimo || !Number.isFinite(prazoDias) || prazoDias < 1) {
            this.exibirMensagem('Preencha leitor, exemplar, data e prazo válido.', 'erro');
            return;
        }

        const leitor = this.leitores.find((item) => Number(item.id_leitor) === Number(leitorId));
        const exemplar = this.exemplares.find((item) => Number(item.id_exemplar) === Number(exemplarId));

        if (!leitor || !exemplar || exemplar.status !== 'DISPONÍVEL') {
            this.exibirMensagem('Exemplar selecionado inválido.', 'erro');
            return;
        }

        const novoEmprestimo = {
            id_emprestimo: this.proximoCodigoEmprestimo(),
            id_leitor: Number(leitorId),
            id_exemplar: Number(exemplarId),
            data_emprestimo: dataEmprestimo,
            prazo_dias: prazoDias,
            data_prevista_devolucao: this.calcularDataPrevista(dataEmprestimo, prazoDias),
            situacao: 'ATIVO'
        };

        this.emprestimos.push(novoEmprestimo);
        exemplar.status = 'EMPRESTADO';

        this.formulario.reset();
        this.fecharModalCadastro();
        this.popularSelectExemplares();
        this.aplicarFiltros();
        this.exibirMensagem('Empréstimo registrado.', 'sucesso');
    }

    proximoCodigoEmprestimo() {
        const maior = this.emprestimos.reduce((maiorId, emprestimo) => Math.max(maiorId, Number(emprestimo.id_emprestimo) || 0), 0);
        return maior + 1;
    }

    calcularDataPrevista(dataEmprestimo, prazoDias) {
        if (!dataEmprestimo) return '';
        const data = new Date(`${dataEmprestimo}T00:00:00`);
        if (Number.isNaN(data.getTime())) return '';
        data.setDate(data.getDate() + Number(prazoDias || 7));
        return data.toISOString().slice(0, 10);
    }

    abrirConfirmacaoDevolucao(emprestimo) {
        if (!emprestimo || !emprestimo.id_emprestimo) return;

        this.emprestimoConfirmando = emprestimo;

        const leitor = this.leitores.find((item) => Number(item.id_leitor) === Number(emprestimo.id_leitor));
        const exemplar = this.exemplares.find((item) => Number(item.id_exemplar) === Number(emprestimo.id_exemplar));
        const livro = exemplar ? this.descreverLivro(exemplar.id_livro) : 'Livro sem título';

        if (this.confirmTitle) {
            this.confirmTitle.textContent = 'Registrar devolução';
        }
        if (this.confirmLivro) {
            this.confirmLivro.textContent = livro;
        }
        if (this.confirmLeitor) {
            this.confirmLeitor.textContent = leitor ? leitor.nome : 'Leitor não encontrado';
        }
        if (this.confirmText) {
            this.confirmText.innerHTML = `Confirma a devolução de '<span id="confirmLivro">${livro}</span>' por <span id="confirmLeitor">${leitor ? leitor.nome : 'Leitor não encontrado'}</span>?`;
        }
        if (this.confirmDelete) {
            this.confirmDelete.textContent = 'Confirmar devolução';
        }

        if (this.modalConfirmacao) {
            this.modalConfirmacao.classList.add('open');
        }
    }

    fecharModalConfirmacao() {
        if (this.modalConfirmacao) {
            this.modalConfirmacao.classList.remove('open');
        }
        this.emprestimoConfirmando = null;
    }

    confirmarDevolucao() {
        if (!this.emprestimoConfirmando || !this.emprestimoConfirmando.id_emprestimo) return;

        const alvo = this.emprestimos.find((item) => Number(item.id_emprestimo) === Number(this.emprestimoConfirmando.id_emprestimo));
        const exemplar = this.exemplares.find((item) => Number(item.id_exemplar) === Number(this.emprestimoConfirmando.id_exemplar));

        if (alvo && exemplar) {
            alvo.situacao = 'DEVOLVIDO';
            exemplar.status = 'DISPONÍVEL';

            this.fecharModalConfirmacao();
            this.popularSelectExemplares();
            this.aplicarFiltros();
            this.exibirMensagem('Devolução registrada.', 'sucesso');
        } else {
            this.exibirMensagem('Empréstimo ou exemplar não encontrado.', 'erro');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('formulario-emprestimo') || !document.getElementById('modalCadastro') || !document.getElementById('modalConfirmacao')) return;
    new TelaEmprestimos(new Api()).iniciar();
});
