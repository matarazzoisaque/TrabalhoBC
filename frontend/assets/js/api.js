/* Comunicação com o back-end.
 *
 * A classe Api concentra todas as chamadas HTTP. Nenhuma outra parte do
 * front-end usa fetch diretamente. */

class Api {
    constructor(base = '/api') {
        this.base = base;
        this.livrosMock = [
            { id_livro: 1, titulo: 'O Pequeno Príncipe', autor: 'Antoine de Saint-Exupéry', genero: 'Fábula', paginas: 96, data_lancamento: '2024-01-10', data_cadastro: '2024-01-10' },
            { id_livro: 2, titulo: 'Dom Casmurro', autor: 'Machado de Assis', genero: 'Romance', paginas: 256, data_lancamento: '2023-10-02', data_cadastro: '2023-10-02' },
            { id_livro: 3, titulo: 'Clean Code', autor: 'Robert C. Martin', genero: 'Técnico', paginas: 464, data_lancamento: '2022-08-20', data_cadastro: '2022-08-20' },
            { id_livro: 4, titulo: 'A Revolução dos Bichos', autor: 'George Orwell', genero: 'Ficção', paginas: 164, data_lancamento: '2023-03-14', data_cadastro: '2023-03-14' },
            { id_livro: 5, titulo: 'Os Sertões', autor: 'Euclides da Cunha', genero: 'História', paginas: 438, data_lancamento: '2021-10-30', data_cadastro: '2021-10-30' }
        ];
    }

    async listarLivros() {
        return this.livrosMock;
    }

    async cadastrarLivro(livro) {
        const novoLivro = {
            id_livro: this.proximoCodigo(),
            titulo: livro.titulo,
            autor: livro.autor,
            genero: livro.genero,
            paginas: Number(livro.paginas),
            data_lancamento: livro.data_lancamento || livro.data_cadastro || new Date().toISOString().slice(0, 10),
            data_cadastro: livro.data_cadastro || new Date().toISOString().slice(0, 10)
        };

        this.livrosMock.push(novoLivro);
        return novoLivro;
    }

    async atualizarLivro(id_livro, livro) {
        const alvo = this.livrosMock.find((livroItem) => Number(livroItem.id_livro) === Number(id_livro));
        if (!alvo) return null;

        Object.assign(alvo, {
            titulo: livro.titulo,
            autor: livro.autor,
            genero: livro.genero,
            paginas: Number(livro.paginas),
            data_lancamento: livro.data_lancamento || livro.data_cadastro || alvo.data_lancamento,
            data_cadastro: livro.data_cadastro || alvo.data_cadastro
        });

        return alvo;
    }

    async excluirLivro(id_livro) {
        const indice = this.livrosMock.findIndex((livro) => Number(livro.id_livro) === Number(id_livro));
        if (indice >= 0) {
            const [removido] = this.livrosMock.splice(indice, 1);
            return removido;
        }

        return null;
    }

    proximoCodigo() {
        const maior = this.livrosMock.reduce((maiorId, livro) => Math.max(maiorId, Number(livro.id_livro) || 0), 0);
        return maior + 1;
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
