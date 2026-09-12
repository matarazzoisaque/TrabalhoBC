/* Telas de livros.
 *
 * O JavaScript cuida só da tela: tema, catálogo, popups e envio do que o
 * usuário digitou. Validação, filtros, ordenação e datas são feitos pelo
 * back-end em Python. */

class TelaLivros {
    constructor(api) {
        this.api = api;
        this.mensagem = document.getElementById('mensagem');
        this.mensagemForm = document.getElementById('mensagem-form');
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
        this.botaoSalvar = null;
        this.livroEditandoId = null;
        this.livroExcluindo = null;
        this.dadosOriginais = null;
        this.esperaBusca = null;
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
        this.openForm.addEventListener('click', () => this.abrirCadastro());

        // Espera o usuário parar de digitar antes de pedir ao servidor.
        this.searchInput.addEventListener('input', () => {
            clearTimeout(this.esperaBusca);
            this.esperaBusca = setTimeout(() => this.carregarLivros(), 300);
        });

        for (const filtro of [this.filterGenero, this.filterPeriodo, this.sortSelect]) {
            filtro.addEventListener('change', () => this.carregarLivros());
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
        this.exibirMensagem(`${livros.length} livro(s) encontrado(s).`);
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
        this.abrirPopupDoFormulario(
            'Cadastrar livro',
            'Preencha os dados abaixo para adicionar o livro ao acervo.',
            'Criar'
        );
    }

    editarLivro(livro) {
        this.livroEditandoId = livro.id_livro;
        this.formulario.titulo.value = livro.titulo;
        this.formulario.autor.value = livro.autor;
        this.formulario.genero.value = livro.genero;
        this.formulario.ano_lancamento.value = livro.ano_lancamento;
        this.formulario.resumo.value = livro.resumo;
        // A data de cadastro não muda na edição: mostra a do livro.
        this.campoDataCadastro.value = livro.data_cadastro;
        this.abrirPopupDoFormulario(
            'Editar livro',
            'Altere os dados do livro e salve as mudanças.',
            'Salvar alterações'
        );
    }

    /* Deixa o popup pronto e guarda o estado inicial, para saber se mudou algo. */
    abrirPopupDoFormulario(titulo, subtitulo, textoDoBotao) {
        this.modalTitle.textContent = titulo;
        this.modalSubtitle.textContent = subtitulo;
        this.botaoSalvar.textContent = textoDoBotao;
        this.dadosOriginais = JSON.stringify(this.dadosDoFormulario());
        this.atualizarContadorResumo();
        this.exibirMensagem('', '', this.mensagemForm);
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

    /* Fechar pelo X (ou clicando fora) pede confirmação se algo mudou. */
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

    visualizarLivro(livro) {
        const valores = { ...livro, data_cadastro: this.formatarData(livro.data_cadastro) };
        for (const elemento of this.viewBackdrop.querySelectorAll('[data-campo]')) {
            elemento.textContent = valores[elemento.dataset.campo];
        }
        this.viewBackdrop.classList.add('open');
    }

    fecharVisualizacao() {
        this.viewBackdrop.classList.remove('open');
    }

    confirmarExclusao(livro) {
        this.livroExcluindo = livro;
        this.confirmLivro.textContent = `"${livro.titulo}"`;
        this.exibirMensagem('', '', this.mensagemExclusao);
        this.confirmBackdrop.classList.add('open');
        this.cancelDelete.focus();
    }

    fecharConfirmacao() {
        this.confirmBackdrop.classList.remove('open');
        this.livroExcluindo = null;
    }

    async excluirLivro() {
        const livro = this.livroExcluindo;
        if (!livro) return;

        this.confirmDelete.disabled = true;
        this.exibirMensagem('Excluindo...', '', this.mensagemExclusao);

        try {
            const excluido = await this.api.excluirLivro(livro.id_livro);
            this.fecharConfirmacao();
            await Promise.all([this.carregarOpcoesDeFiltro(), this.carregarLivros()]);
            this.exibirMensagem(`Livro "${excluido.titulo}" excluído do acervo.`, 'sucesso');
        } catch (erro) {
            this.exibirMensagem(erro.message, 'erro', this.mensagemExclusao);
        } finally {
            this.confirmDelete.disabled = false;
        }
    }

    atualizarContadorResumo() {
        const total = this.campoResumo.value.length;
        const limite = this.campoResumo.maxLength;
        const atingiu = total >= limite;

        this.contadorResumo.textContent = `${total}/${limite} caracteres${atingiu ? ' — limite atingido' : ''}`;
        this.contadorResumo.classList.toggle('limite', atingiu);
    }

    /* Só para mostrar no formulário; a data gravada é definida pelo servidor. */
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
        this.exibirMensagem('Salvando...', '', this.mensagemForm);

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
            this.exibirMensagem(erro.message, 'erro', this.mensagemForm);
        } finally {
            this.botaoSalvar.disabled = false;
        }
    }

    exibirMensagem(texto, tipo = '', alvo = this.mensagem) {
        if (!alvo) return;

        alvo.textContent = texto;
        alvo.className = tipo ? `mensagem ${tipo}` : 'mensagem';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TelaLivros(new Api()).iniciar();
});
