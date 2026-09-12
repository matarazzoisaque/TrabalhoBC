/* Telas de livros.
 *
 * O JavaScript cuida só da tela: tema, catálogo, popups e envio do que o
 * usuário digitou. Validação, filtros, ordenação e datas são feitos pelo
 * back-end em Python. */

class TelaLivros {
    constructor(api) {
        this.api = api;
        this.mensagem = document.getElementById('mensagem');
        this.mensagemFormulario = document.getElementById('mensagem-formulario');
        this.mensagemExclusao = document.getElementById('mensagem-exclusao');
        this.catalogList = document.getElementById('catalogList');
        this.formulario = document.getElementById('formulario-livro');
        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalSubtitle = document.getElementById('modalSubtitle');
        this.closeModal = document.getElementById('closeModal');
        this.viewBackdrop = document.getElementById('viewBackdrop');
        this.closeView = document.getElementById('closeView');
        this.confirmBackdrop = document.getElementById('confirmBackdrop');
        this.closeConfirm = document.getElementById('closeConfirm');
        this.cancelDelete = document.getElementById('cancelDelete');
        this.confirmDelete = document.getElementById('confirmDelete');
        this.confirmLivro = document.getElementById('confirmLivro');
        this.openForm = document.getElementById('openForm');
        this.searchInput = document.getElementById('searchInput');
        this.filterGenero = document.getElementById('filterGenero');
        this.filterPeriodo = document.getElementById('filterPeriodo');
        this.sortSelect = document.getElementById('sortSelect');
        this.campoAno = document.getElementById('ano_lancamento');
        this.campoDataCadastro = document.getElementById('data_cadastro');
        this.campoResumo = document.getElementById('resumo');
        this.contadorResumo = document.getElementById('contador-resumo');
        this.themeToggle = document.getElementById('themeToggle');
        this.viewTitle = document.getElementById('viewTitle');
        this.viewSubtitle = document.getElementById('viewSubtitle');
        this.viewAnoLancamento = document.getElementById('viewAnoLancamento');
        this.viewDataCadastro = document.getElementById('viewDataCadastro');
        this.viewCodigo = document.getElementById('viewCodigo');
        this.viewExemplaresDisponiveis = document.getElementById('viewExemplaresDisponiveis');
        this.closeViewBook = document.getElementById('closeViewBook');
        this.livros = [];
        this.livroEditandoId = null;
        this.livroExcluindo = null;
        this.dadosOriginais = null;
        this.esperaBusca = null;
        this.botaoSalvar = null;
        this.toastTimer = null;
        this.toastHideTimer = null;
    }

    iniciar() {
        this.aplicarTemaSalvo();
        this.configurarTema();

        // A página inicial só tem o tema; o resto é da página do catálogo.
        if (!this.catalogList) return;

        this.configurarCatalogo();
        this.configurarCadastro();
        this.configurarVisualizacao();
        this.configurarExclusao();
        this.carregarOpcoesDeFiltro();
        this.carregarLivros();
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
        this.openForm.addEventListener('click', () => this.abrirCadastro());

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.aplicarFiltros());
        }

        if (this.filterGenero) {
            this.filterGenero.addEventListener('change', () => this.aplicarFiltros());
        }

        if (this.filterPeriodo) {
            this.filterPeriodo.addEventListener('change', () => this.aplicarFiltros());
        }

        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', () => this.aplicarFiltros());
        }

        if (this.closeView) {
            this.closeView.addEventListener('click', () => this.fecharVisualizacaoLivro());
        }

        if (this.closeViewBook) {
            this.closeViewBook.addEventListener('click', () => this.fecharVisualizacaoLivro());
        }

        if (this.viewBackdrop) {
            this.viewBackdrop.addEventListener('click', (evento) => {
                if (evento.target === this.viewBackdrop) {
                    this.fecharVisualizacaoLivro();
                }
            });
        }
    }

    configurarCadastro() {
        this.botaoSalvar = this.formulario.querySelector('button[type="submit"]');

        this.formulario.addEventListener('submit', (evento) => this.salvar(evento));
        this.closeModal.addEventListener('click', () => this.pedirFechamento());
        this.modalBackdrop.addEventListener('click', (evento) => {
            if (evento.target === this.modalBackdrop) this.pedirFechamento();
        });

        this.campoAno.max = new Date().getFullYear();
        this.campoResumo.addEventListener('input', () => this.atualizarContadorResumo());
    }

    configurarVisualizacao() {
        this.closeView.addEventListener('click', () => this.fecharVisualizacao());
        this.viewBackdrop.addEventListener('click', (evento) => {
            if (evento.target === this.viewBackdrop) this.fecharVisualizacao();
        });
    }

    configurarExclusao() {
        this.confirmDelete.addEventListener('click', () => this.excluirLivro());
        this.cancelDelete.addEventListener('click', () => this.fecharConfirmacao());
        this.closeConfirm.addEventListener('click', () => this.fecharConfirmacao());
        this.confirmBackdrop.addEventListener('click', (evento) => {
            if (evento.target === this.confirmBackdrop) this.fecharConfirmacao();
        });
    }

    async carregarOpcoesDeFiltro() {
        try {
            const opcoes = await this.api.opcoesDeFiltro();
            this.preencherSelect(this.filterGenero, opcoes.generos);
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    preencherSelect(select, valores) {
        const atual = select.value;

        select.replaceChildren(new Option('Todos', ''));
        for (const valor of valores) {
            select.appendChild(new Option(valor, valor));
        }
        if (valores.includes(atual)) select.value = atual;
    }

    filtrosAtuais() {
        return {
            busca: this.searchInput.value,
            genero: this.filterGenero.value,
            periodo: this.filterPeriodo.value,
            ordem: this.sortSelect.value
        };
    }

    async carregarLivros() {
        this.exibirMensagem('Carregando livros...');
        try {
            const filtros = this.filtrosAtuais();
            const livros = await this.api.listarLivros(filtros);
            this.desenharCatalogo(livros, filtros);
        } catch (erro) {
            this.catalogList.replaceChildren();
            this.exibirMensagem(erro.message, 'erro');
        }
    }

    desenharCatalogo(livros, filtros) {
        this.catalogList.replaceChildren();

        if (livros.length === 0) {
            const filtrando = filtros.busca.trim() || filtros.genero || filtros.periodo;
            this.exibirMensagem(filtrando
                ? 'Nenhum livro encontrado com esses filtros.'
                : 'Nenhum livro cadastrado ainda. Clique em "Cadastrar novo livro".');
            return;
        }

        for (const livro of livros) {
            this.catalogList.appendChild(this.criarItem(livro));
        }
    }

    /* Monta um card do catálogo. Usa textContent: o conteúdo vem do usuário. */
    criarItem(livro) {
        const principal = this.criarElemento('div', 'book-main');
        principal.append(
            this.criarElemento('div', 'book-title', livro.titulo),
            this.criarElemento('div', 'book-author', livro.autor)
        );

        const ver = this.criarBotaoAcao('👁', 'Ver livro', 'view');
        ver.addEventListener('click', () => this.visualizarLivro(livro));

        const editar = this.criarBotaoAcao('✎', 'Editar livro', 'edit');
        editar.addEventListener('click', () => this.editarLivro(livro));

        const excluir = this.criarBotaoAcao('×', 'Excluir livro', 'delete');
        excluir.addEventListener('click', () => this.confirmarExclusao(livro));

        const acoes = this.criarElemento('div', 'book-actions');
        acoes.append(ver, editar, excluir);

        const item = this.criarElemento('article', 'catalog-item');
        item.append(
            principal,
            this.criarColuna('GÊNERO', livro.genero),
            this.criarColuna('ANO DE LANÇAMENTO', livro.ano_lancamento),
            this.criarColuna('DATA DE CADASTRO', this.formatarData(livro.data_cadastro)),
            acoes
        );
        return item;
    }

    criarColuna(rotulo, valor) {
        const coluna = this.criarElemento('div', 'book-meta-column');
        coluna.append(
            this.criarElemento('span', 'book-label', rotulo),
            this.criarElemento('span', 'book-value', valor)
        );
        return coluna;
    }

    criarBotaoAcao(icone, titulo, tipo) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = tipo === 'delete' ? 'icon-button delete' : 'icon-button';
        btn.title = titulo;
        btn.setAttribute('aria-label', titulo);
        btn.textContent = icone;
        return btn;
    }

    criarElemento(tag, classe, texto) {
        const elemento = document.createElement(tag);
        elemento.className = classe;
        if (texto !== undefined) elemento.textContent = texto;
        return elemento;
    }

    formatarData(data) {
        if (!data) return 'Sem data';
        const date = new Date(`${data}T00:00:00`);
        if (Number.isNaN(date.getTime())) return data;
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    }

    abrirCadastro() {
        this.livroEditandoId = null;
        this.formulario.reset();
        this.campoDataCadastro.value = this.hojeISO();
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

    fecharVisualizacaoLivro() {
        if (this.viewBackdrop) {
            this.viewBackdrop.classList.remove('open');
        }
    }

    visualizarLivro(livro) {
        this.fecharModal();

        if (this.viewTitle) this.viewTitle.textContent = livro.titulo || 'Livro';
        if (this.viewSubtitle) this.viewSubtitle.textContent = livro.autor || 'Autor desconhecido';
        if (this.viewAnoLancamento) this.viewAnoLancamento.textContent = this.formatarAnoLancamento(livro.data_lancamento || livro.data_cadastro);
        if (this.viewDataCadastro) this.viewDataCadastro.textContent = this.formatarData(livro.data_cadastro);
        if (this.viewCodigo) this.viewCodigo.textContent = livro.id_livro || 'Sem código';

        // MOCK: contagem de exemplares em memória, deve ser substituída
        // pela contagem real vinda da API de exemplares quando existir.
        const mock = this.calcularMockExemplaresDisponiveis(livro.id_livro);
        if (this.viewExemplaresDisponiveis) {
            this.viewExemplaresDisponiveis.textContent = `${mock.disponiveis} de ${mock.total} exemplares disponíveis`;
        }

        if (this.viewBackdrop) {
            this.viewBackdrop.classList.add('open');
        }
    }

    formatarAnoLancamento(data) {
        if (!data) return 'Sem data';
        const date = new Date(`${data}T00:00:00`);
        if (Number.isNaN(date.getTime())) return data;
        return new Intl.DateTimeFormat('pt-BR', { year: 'numeric' }).format(date);
    }

    calcularMockExemplaresDisponiveis(idLivro) {
        const id = Number(idLivro) || 1;
        const total = 1 + (id % 6);
        const disponiveis = (id * 2) % (total + 1);
        return {
            total,
            disponiveis
        };
    }

    editarLivro(livro) {
        this.livroEditandoId = livro.id_livro;
        this.formulario.titulo.value = livro.titulo;
        this.formulario.autor.value = livro.autor;
        this.formulario.genero.value = livro.genero;
        this.formulario.ano_lancamento.value = livro.ano_lancamento;
        this.formulario.resumo.value = livro.resumo;
        this.campoDataCadastro.value = livro.data_cadastro;
        this.abrirPopupDoFormulario(
            'Editar livro',
            'Altere os dados do livro e salve as mudanças.',
            'Salvar alterações'
        );
    }

    abrirPopupDoFormulario(titulo, subtitulo, textoDoBotao) {
        this.modalTitle.textContent = titulo;
        this.modalSubtitle.textContent = subtitulo;
        this.botaoSalvar.textContent = textoDoBotao;
        this.dadosOriginais = JSON.stringify(this.dadosDoFormulario());
        this.atualizarContadorResumo();
        this.exibirMensagem('', '', this.mensagemFormulario);
        this.modalBackdrop.classList.add('open');
        this.formulario.titulo.focus();
    }

    dadosDoFormulario() {
        return {
            titulo: this.formulario.titulo.value,
            autor: this.formulario.autor.value,
            genero: this.formulario.genero.value,
            ano_lancamento: this.formulario.ano_lancamento.value,
            resumo: this.formulario.resumo.value
        };
    }

    formularioAlterado() {
        return JSON.stringify(this.dadosDoFormulario()) !== this.dadosOriginais;
    }

    pedirFechamento() {
        const pergunta = this.livroEditandoId
            ? 'Deseja cancelar a edição do livro?'
            : 'Deseja cancelar o cadastro do livro?';

        if (this.formularioAlterado() && !window.confirm(pergunta)) return;
        this.fecharFormulario();
    }

    fecharFormulario() {
        this.modalBackdrop.classList.remove('open');
        this.formulario.reset();
        this.livroEditandoId = null;
    }

    preencherFormulario(livro) {
        if (!this.formulario) return;
        this.formulario.titulo.value = livro.titulo || '';
        this.formulario.autor.value = livro.autor || '';
        this.formulario.genero.value = livro.genero || '';
        this.formulario.paginas.value = livro.paginas || '';
        this.formulario.data_lancamento.value = livro.data_lancamento || livro.data_cadastro || '';
        this.formulario.data_cadastro.value = livro.data_cadastro || new Date().toISOString().slice(0, 10);
    }

    atualizarContadorResumo() {
        const total = this.campoResumo.value.length;
        const limite = this.campoResumo.maxLength;
        const atingiu = total >= limite;

        this.contadorResumo.textContent = `${total}/${limite} caracteres${atingiu ? ' — limite atingido' : ''}`;
        this.contadorResumo.classList.toggle('limite', atingiu);
    }

    hojeISO() {
        const hoje = new Date();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const dia = String(hoje.getDate()).padStart(2, '0');
        return `${hoje.getFullYear()}-${mes}-${dia}`;
    }

    async salvar(evento) {
        evento.preventDefault();

        const livro = this.dadosDoFormulario();
        const editando = this.livroEditandoId;

        this.botaoSalvar.disabled = true;
        this.exibirMensagem('Salvando...', '', this.mensagemFormulario);

        try {
            const salvo = editando
                ? await this.api.atualizarLivro(editando, livro)
                : await this.api.cadastrarLivro(livro);

            this.fecharFormulario();
            await Promise.all([this.carregarOpcoesDeFiltro(), this.carregarLivros()]);
            this.exibirMensagem(
                `Livro "${salvo.titulo}" ${editando ? 'atualizado' : 'cadastrado'} com sucesso.`,
                'sucesso'
            );
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro', this.mensagemFormulario);
        } finally {
            this.botaoSalvar.disabled = false;
        }
    }

    exibirMensagem(texto, tipo = '', alvo = this.mensagem) {
        if (!alvo) return;

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

        if (this.mensagemExclusao) {
            this.mensagemExclusao.textContent = texto;
            this.mensagemExclusao.className = classe;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('formulario-livro') || !document.getElementById('modalBackdrop')) return;
    new TelaLivros(new Api()).iniciar();
});
