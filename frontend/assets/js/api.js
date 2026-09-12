/* Comunicação com o back-end.
 *
 * A classe Api concentra todas as chamadas HTTP. Nenhuma outra parte do
 * front-end usa fetch diretamente. */

class Api {
    constructor(base = '/api') {
        this.base = base;
    }

    /* Busca os livros; filtros e ordenação são aplicados pelo servidor. */
    async listarLivros(filtros = {}) {
        const parametros = new URLSearchParams();
        for (const [chave, valor] of Object.entries(filtros)) {
            if (valor) parametros.append(chave, valor);
        }
        const consulta = parametros.toString();
        return this.requisitar(consulta ? `/livros?${consulta}` : '/livros');
    }

    /* Autores e gêneros cadastrados, para preencher os filtros. */
    async opcoesDeFiltro() {
        return this.requisitar('/livros/filtros');
    }

    /* Envia um novo livro para ser cadastrado. */
    async cadastrarLivro(livro) {
        return this.requisitar('/livros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(livro)
        });
    }

    /* Envia as alterações de um livro já cadastrado. */
    async atualizarLivro(idLivro, livro) {
        return this.requisitar(`/livros/${idLivro}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(livro)
        });
    }

    /* Exclui um livro do acervo. */
    async excluirLivro(idLivro) {
        return this.requisitar(`/livros/${idLivro}`, { method: 'DELETE' });
    }

    /* Faz a requisição e transforma erro do servidor em exceção. */
    async requisitar(caminho, opcoes = {}) {
        let resposta;
        try {
            resposta = await fetch(this.base + caminho, opcoes);
        } catch (erro) {
            throw new Error(
                'Não foi possível falar com o servidor. Rode "python -m app.main" '
                + 'e abra o sistema por http://127.0.0.1:8000 (não pelo arquivo).'
            );
        }

        const corpo = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            throw new Error(corpo && corpo.erro ? corpo.erro : `Erro ${resposta.status} ao acessar o servidor.`);
        }

        return corpo;
    }
}

/* Dados simulados em memória para leitores, exemplares e empréstimos.
 *
 * Mantém o mesmo padrão assíncrono da camada Api, com Promise retornada
 * para cada operação. Quando a API real existir, basta trocar a instância
 * por uma classe real compatível sem reescrever as telas.
 */
class DadosSimulados {
    constructor() {
        this.leitores = [
            { id_leitor: 1, nome: 'Ana Silva', email: 'ana.silva@email.com', telefone: '(11) 99999-1001', data_cadastro: '2026-09-01', ativo: true },
            { id_leitor: 2, nome: 'Bruno Costa', email: 'bruno.costa@email.com', telefone: '(11) 99999-1002', data_cadastro: '2026-09-02', ativo: true },
            { id_leitor: 3, nome: 'Carla Mendes', email: 'carla.mendes@email.com', telefone: '(11) 99999-1003', data_cadastro: '2026-09-03', ativo: true }
        ];

        this.exemplares = [
            { id_exemplar: 1, id_livro: 1, codigo: 'BK-001', status: 'disponivel', localizacao: 'Prateleira A1' },
            { id_exemplar: 2, id_livro: 2, codigo: 'BK-002', status: 'disponivel', localizacao: 'Prateleira B2' },
            { id_exemplar: 3, id_livro: 3, codigo: 'BK-003', status: 'emprestado', localizacao: 'Prateleira C1' },
            { id_exemplar: 4, id_livro: 4, codigo: 'BK-004', status: 'disponivel', localizacao: 'Prateleira D4' }
        ];

        this.emprestimos = [
            { id_emprestimo: 1, id_leitor: 1, id_exemplar: 3, data_emprestimo: '2026-09-01', data_prevista: '2026-09-08', data_devolucao: null, status: 'emprestado' },
            { id_emprestimo: 2, id_leitor: 2, id_exemplar: 2, data_emprestimo: '2026-08-25', data_prevista: '2026-09-01', data_devolucao: '2026-08-30', status: 'devolvido' }
        ];
    }

    async listarLeitores() {
        return Promise.resolve(this.leitores.map((leitor) => ({ ...leitor })));
    }

    async cadastrarLeitor(leitor) {
        const novoLeitor = {
            id_leitor: this.proximoCodigoLeitor(),
            nome: leitor.nome,
            email: leitor.email,
            telefone: leitor.telefone || '',
            ativo: leitor.ativo !== false
        };

        this.leitores.push(novoLeitor);
        return Promise.resolve({ ...novoLeitor });
    }

    async atualizarLeitor(id_leitor, leitor) {
        const alvo = this.leitores.find((item) => Number(item.id_leitor) === Number(id_leitor));
        if (!alvo) return Promise.resolve(null);

        Object.assign(alvo, {
            nome: leitor.nome,
            email: leitor.email,
            telefone: leitor.telefone || alvo.telefone,
            ativo: leitor.ativo !== false
        });

        return Promise.resolve({ ...alvo });
    }

    async excluirLeitor(id_leitor) {
        const indice = this.leitores.findIndex((leitor) => Number(leitor.id_leitor) === Number(id_leitor));
        if (indice >= 0) {
            const [removido] = this.leitores.splice(indice, 1);
            return Promise.resolve({ ...removido });
        }

        return Promise.resolve(null);
    }

    async listarExemplares() {
        return Promise.resolve(this.exemplares.map((exemplar) => ({ ...exemplar })));
    }

    async cadastrarExemplar(exemplar) {
        const novoExemplar = {
            id_exemplar: this.proximoCodigoExemplar(),
            id_livro: Number(exemplar.id_livro),
            codigo: exemplar.codigo,
            status: exemplar.status || 'disponivel',
            localizacao: exemplar.localizacao || ''
        };

        this.exemplares.push(novoExemplar);
        return Promise.resolve({ ...novoExemplar });
    }

    async atualizarExemplar(id_exemplar, exemplar) {
        const alvo = this.exemplares.find((item) => Number(item.id_exemplar) === Number(id_exemplar));
        if (!alvo) return Promise.resolve(null);

        Object.assign(alvo, {
            id_livro: Number(exemplar.id_livro),
            codigo: exemplar.codigo,
            status: exemplar.status || alvo.status,
            localizacao: exemplar.localizacao || alvo.localizacao
        });

        return Promise.resolve({ ...alvo });
    }

    async excluirExemplar(id_exemplar) {
        const indice = this.exemplares.findIndex((exemplar) => Number(exemplar.id_exemplar) === Number(id_exemplar));
        if (indice >= 0) {
            const [removido] = this.exemplares.splice(indice, 1);
            return Promise.resolve({ ...removido });
        }

        return Promise.resolve(null);
    }

    async listarEmprestimos() {
        return Promise.resolve(this.emprestimos.map((emprestimo) => ({ ...emprestimo })));
    }

    async cadastrarEmprestimo(emprestimo) {
        const novoEmprestimo = {
            id_emprestimo: this.proximoCodigoEmprestimo(),
            id_leitor: Number(emprestimo.id_leitor),
            id_exemplar: Number(emprestimo.id_exemplar),
            data_emprestimo: emprestimo.data_emprestimo || new Date().toISOString().slice(0, 10),
            data_prevista: emprestimo.data_prevista || '',
            data_devolucao: emprestimo.data_devolucao || null,
            status: emprestimo.status || 'emprestado'
        };

        this.emprestimos.push(novoEmprestimo);
        return Promise.resolve({ ...novoEmprestimo });
    }

    async atualizarEmprestimo(id_emprestimo, emprestimo) {
        const alvo = this.emprestimos.find((item) => Number(item.id_emprestimo) === Number(id_emprestimo));
        if (!alvo) return Promise.resolve(null);

        Object.assign(alvo, {
            id_leitor: Number(emprestimo.id_leitor),
            id_exemplar: Number(emprestimo.id_exemplar),
            data_emprestimo: emprestimo.data_emprestimo || alvo.data_emprestimo,
            data_prevista: emprestimo.data_prevista || alvo.data_prevista,
            data_devolucao: emprestimo.data_devolucao || alvo.data_devolucao,
            status: emprestimo.status || alvo.status
        });

        return Promise.resolve({ ...alvo });
    }

    async excluirEmprestimo(id_emprestimo) {
        const indice = this.emprestimos.findIndex((emprestimo) => Number(emprestimo.id_emprestimo) === Number(id_emprestimo));
        if (indice >= 0) {
            const [removido] = this.emprestimos.splice(indice, 1);
            return Promise.resolve({ ...removido });
        }

        return Promise.resolve(null);
    }

    proximoCodigoLeitor() {
        const maior = this.leitores.reduce((maiorId, leitor) => Math.max(maiorId, Number(leitor.id_leitor) || 0), 0);
        return maior + 1;
    }

    proximoCodigoExemplar() {
        const maior = this.exemplares.reduce((maiorId, exemplar) => Math.max(maiorId, Number(exemplar.id_exemplar) || 0), 0);
        return maior + 1;
    }

    proximoCodigoEmprestimo() {
        const maior = this.emprestimos.reduce((maiorId, emprestimo) => Math.max(maiorId, Number(emprestimo.id_emprestimo) || 0), 0);
        return maior + 1;
    }
}
