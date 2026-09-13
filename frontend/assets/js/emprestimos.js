/* Tela de empréstimos.
 *
 * O JavaScript cuida só da tela: tema, catálogo, popups e envio do que o
 * usuário escolheu. As regras do empréstimo, a disponibilidade dos
 * exemplares, a situação e a data de devolução são do back-end em Python. */

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
        this.emprestimoConfirmando = null;
        this.esperaBusca = null;
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
            // Espera o usuário parar de digitar antes de pedir ao servidor.
            this.searchInput.addEventListener('input', () => {
                clearTimeout(this.esperaBusca);
                this.esperaBusca = setTimeout(() => this.carregarEmprestimos(), 300);
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
        await Promise.all([this.carregarOpcoes(), this.carregarEmprestimos()]);
    }

    /* Leitores e exemplares disponíveis para os selects; quem filtra os disponíveis é o servidor. */
    async carregarOpcoes() {
        try {
            const [leitores, exemplares] = await Promise.all([
                this.api.listarLeitores(),
                this.api.listarExemplares({ status: 'DISPONIVEL' })
            ]);
            this.popularSelectLeitores(leitores);
            this.popularSelectExemplares(exemplares);
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    /* Pede ao servidor os empréstimos, já com leitor, livro e situação. */
    async carregarEmprestimos() {
        try {
            const busca = this.searchInput ? this.searchInput.value : '';
            const emprestimos = await this.api.listarEmprestimos({ busca });
            this.desenharCatalogo(emprestimos);
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    popularSelectLeitores(leitores) {
        if (!this.leitorSelect) return;

        this.leitorSelect.replaceChildren();
        this.leitorSelect.appendChild(new Option('Selecione um leitor', ''));

        for (const leitor of leitores) {
            this.leitorSelect.appendChild(new Option(leitor.nome, String(leitor.id_leitor)));
        }
    }

    popularSelectExemplares(exemplares) {
        if (!this.exemplarSelect) return;

        this.exemplarSelect.replaceChildren();
        this.exemplarSelect.appendChild(new Option('Selecione um exemplar', ''));

        for (const exemplar of exemplares) {
            const texto = `Exemplar ${exemplar.id_exemplar} — ${exemplar.titulo_livro}`;
            this.exemplarSelect.appendChild(new Option(texto, String(exemplar.id_exemplar)));
        }
    }

    desenharCatalogo(emprestimos) {
        if (!this.catalogList) return;

        this.catalogList.replaceChildren();

        if (!emprestimos || emprestimos.length === 0) {
            this.exibirMensagem('Nenhum empréstimo encontrado.', 'erro');
            return;
        }

        this.exibirMensagem('');
        for (const emprestimo of emprestimos) {
            const item = document.createElement('article');
            item.className = 'catalog-item emprestimo-item';

            const actions = document.createElement('div');
            actions.className = 'book-actions';

            if (emprestimo.situacao === 'ATIVO') {
                const devolucao = this.criarBotaoAcao('↺', 'Registrar devolução', 'devolver');
                devolucao.addEventListener('click', () => this.abrirConfirmacaoDevolucao(emprestimo));
                actions.appendChild(devolucao);
            }

            item.append(
                this.criarColuna('LEITOR', emprestimo.nome_leitor),
                this.criarColuna('LIVRO', emprestimo.titulo_livro),
                // Código do exemplar: diz qual cópia do livro foi emprestada.
                this.criarColuna('CÓDIGO', emprestimo.id_exemplar),
                this.criarColuna('DATA DO EMPRÉSTIMO', this.formatarData(emprestimo.data_emprestimo)),
                this.criarColuna('SITUAÇÃO', emprestimo.situacao),
                actions
            );
            this.catalogList.appendChild(item);
        }
    }

    /* Monta uma coluna do card. Usa textContent: o conteúdo vem do usuário. */
    criarColuna(rotulo, valor) {
        const coluna = document.createElement('div');
        coluna.className = 'book-meta-column';

        const label = document.createElement('span');
        label.className = 'book-label';
        label.textContent = rotulo;

        const value = document.createElement('span');
        value.className = 'book-value';
        value.textContent = valor;

        coluna.append(label, value);
        return coluna;
    }

    criarBotaoAcao(icone, titulo, tipo) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = tipo === 'devolver' ? 'icon-button' : 'icon-button delete';
        btn.title = titulo;
        btn.textContent = icone;
        return btn;
    }

    formatarData(data) {
        if (!data) return 'Sem data';
        const date = new Date(`${data}T00:00:00`);
        if (Number.isNaN(date.getTime())) return data;
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    }

    /* Data de hoje no fuso do computador (toISOString usaria UTC e viraria o dia seguinte à noite). */
    hojeISO() {
        const hoje = new Date();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${hoje.getFullYear()}-${mes}-${dia}`;
    }

    async abrirModalCadastro() {
        this.formulario.reset();
        this.modalTitle.textContent = 'Novo empréstimo';
        this.formulario.data_emprestimo.value = this.hojeISO();

        // Atualiza os selects: um exemplar pode ter sido devolvido ou emprestado.
        await this.carregarOpcoes();

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

    /* Envia leitor, exemplar e data; as regras do empréstimo ficam no servidor. */
    async salvar(evento) {
        evento.preventDefault();
        if (!this.formulario) return;

        const botao = this.formulario.querySelector('button[type="submit"]');
        const emprestimo = {
            id_leitor: this.formulario.leitorSelect.value,
            id_exemplar: this.formulario.exemplarSelect.value,
            data_emprestimo: this.formulario.data_emprestimo.value
        };

        botao.disabled = true;
        this.exibirMensagem('Salvando...');

        try {
            await this.api.registrarEmprestimo(emprestimo);
            this.fecharModalCadastro();
            await this.carregarDados();
            this.exibirMensagem('Empréstimo registrado.', 'sucesso');
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        } finally {
            botao.disabled = false;
        }
    }

    abrirConfirmacaoDevolucao(emprestimo) {
        if (!emprestimo || !emprestimo.id_emprestimo) return;

        this.emprestimoConfirmando = emprestimo;

        if (this.confirmTitle) {
            this.confirmTitle.textContent = 'Registrar devolução';
        }
        if (this.confirmLivro) {
            this.confirmLivro.textContent = emprestimo.titulo_livro;
        }
        if (this.confirmLeitor) {
            this.confirmLeitor.textContent = emprestimo.nome_leitor;
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

    async confirmarDevolucao() {
        if (!this.emprestimoConfirmando) return;

        try {
            await this.api.registrarDevolucao(this.emprestimoConfirmando.id_emprestimo);
            this.fecharModalConfirmacao();
            await this.carregarDados();
            this.exibirMensagem('Devolução registrada.', 'sucesso');
        } catch (erro) {
            // O popup não tem espaço para mensagem: fecha e mostra o motivo na tela.
            this.fecharModalConfirmacao();
            this.exibirMensagem(erro.message, 'erro');
        }
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
    if (!document.getElementById('formulario-emprestimo')) return;
    new TelaEmprestimos(new Api()).iniciar();
});
