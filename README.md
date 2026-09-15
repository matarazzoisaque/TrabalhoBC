# Biblioteca

Sistema acadêmico de gerenciamento de biblioteca. Back-end em **Python puro**,
front-end em **HTML, CSS e JavaScript puros** e banco de dados **MySQL** —
sem frameworks.

> Integrantes, RAs e objetivo detalhado do trabalho: **pendente de preenchimento**.

## Tecnologias

- **Back-end:** Python 3.10+ (`http.server` e `json`, da biblioteca padrão)
- **Banco de dados:** MySQL 8+ (driver `mysql-connector-python`)
- **Front-end:** HTML, CSS e JavaScript puros (sem framework, sem build)

## Estrutura do projeto

```text
biblioteca/
├── README.md
├── .gitignore
├── requirements.txt                    # mysql-connector-python
│
├── app/
│   ├── main.py                         # monta a aplicação e sobe o servidor
│   │
│   ├── core/
│   │   ├── database.py                 # classe Database (conexão MySQL)
│   │   └── servidor.py                 # classe Servidor (HTTP + rotas)
│   │
│   ├── models/
│   │   └── livro.py                    # classe Livro
│   │
│   ├── repositories/
│   │   └── livro_repository.py         # classe LivroRepository (SQL)
│   │
│   └── services/
│       └── livro_service.py            # classe LivroService (regras)
│
├── config/
│   └── config.py                       # host, usuário, senha, banco, porta
│
├── database/
│   ├── ddl.sql                         # CREATE DATABASE e CREATE TABLE
│   └── dml_inicial.sql                 # livros de exemplo
│
├── frontend/
│   ├── index.html                      # lista os livros do acervo
│   ├── cadastro.html                   # formulário de cadastro
│   └── assets/
│       ├── css/
│       │   └── style.css
│       └── js/
│           ├── api.js                  # classe Api (chamadas ao back-end)
│           └── livros.js               # classe TelaLivros (telas de livro)
│
├── docs/
│   ├── der.png
│   ├── regras-negocio.md
│   └── evidencias/                     # prints de tela do sistema
│
└── tests/
    └── test_livro.py                   # validações do livro
```

## Função de cada área

| Pasta ou arquivo | Finalidade |
|---|---|
| `README.md` | Documento principal do trabalho |
| `.gitignore` | Impede o envio de arquivos desnecessários (`__pycache__`, ambientes virtuais, arquivos de editor) |
| `requirements.txt` | Dependências do projeto — apenas o driver do MySQL |
| `app/main.py` | Monta banco → repositório → service → servidor e inicia a aplicação |
| `app/core/database.py` | Abre a conexão com o MySQL e executa os comandos SQL |
| `app/core/servidor.py` | Entrega os arquivos do front-end e responde às rotas `/api/*` |
| `app/models/livro.py` | Representa um livro e converte entre objeto e dicionário |
| `app/repositories/` | Única camada que conhece SQL: `SELECT` e `INSERT` da tabela `livros` |
| `app/services/` | Regras de negócio e validações aplicadas antes de gravar |
| `config/config.py` | Centraliza os dados de acesso ao banco e o endereço do servidor |
| `database/ddl.sql` | Cria o banco `biblioteca` e a tabela `livros` com suas restrições |
| `database/dml_inicial.sql` | Insere livros de exemplo para demonstração |
| `frontend/` | Páginas HTML e recursos estáticos do sistema |
| `frontend/assets/js/api.js` | Concentra toda a comunicação HTTP com o back-end |
| `frontend/assets/js/livros.js` | Monta a listagem e trata o envio do formulário |
| `docs/` | Documentação técnica e acadêmica do trabalho |
| `docs/evidencias/` | Capturas de tela que comprovam o funcionamento |
| `tests/test_livro.py` | Testes automatizados das validações de livro |

## Como executar

### 1. Criar o banco de dados

```bash
mysql -u root -p < database/ddl.sql
mysql -u root -p < database/dml_inicial.sql
```

### 2. Ajustar as credenciais

Crie o arquivo local de configuracao a partir do exemplo:

```powershell
Copy-Item config/config.example.py config/config.py
```

Edite `config/config.py` com o usuário e a senha do seu MySQL:

```python
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "root"
DB_PASSWORD = ""
DB_NAME = "biblioteca"
```

### 3. Instalar a dependência

```bash
pip install -r requirements.txt
```

### 4. Subir o servidor

A partir da raiz do projeto:

```bash
python -m app.main
```

Depois acesse **http://127.0.0.1:8000**.

### 5. Rodar os testes

```bash
python -m unittest tests.test_livro
```

Os testes usam um repositório falso, então rodam sem MySQL instalado.

## Como o front-end conversa com o back-end

O mesmo servidor entrega as páginas e responde à API, então não há
configuração de CORS nem endereço fixo no JavaScript:

```
navegador                     app/core/servidor.py
   │                                  │
   │  GET /                           │──► entrega frontend/index.html
   │  GET /assets/js/api.js           │──► entrega o arquivo estático
   │                                  │
   │  GET /api/livros                 │──► LivroService.listar()
   │                                  │      └► LivroRepository → SELECT
   │  ◄── 200 [ {...}, {...} ]        │
   │                                  │
   │  POST /api/livros                │──► LivroService.cadastrar()
   │       {titulo, autor, ano}       │      ├► validações
   │                                  │      └► LivroRepository → INSERT
   │  ◄── 201 { id_livro: 6, ... }    │
```

### Rotas disponíveis

| Método | Rota | O que faz | Respostas |
|---|---|---|---|
| `GET` | `/api/livros` | Lista todos os livros, em ordem de título | `200` |
| `POST` | `/api/livros` | Cadastra um livro | `201`, `400` |

Qualquer rota `/api/*` desconhecida devolve `404`. Erros de validação
devolvem `400`, e falhas de conexão com o MySQL devolvem `503` — sempre em
JSON, com a chave `erro`.

## Modelo de dados

![DER do sistema](docs/der.png)

Regras de negócio detalhadas em [`docs/regras-negocio.md`](docs/regras-negocio.md).

## Estado atual

Esta etapa entrega a **estrutura completa do projeto com o back-end já
conectado ao front-end**:

- `index.html` busca os livros em `GET /api/livros` e monta a tabela.
- `cadastro.html` envia o formulário para `POST /api/livros`, que valida os
  dados e grava no MySQL.

Leitores, exemplares e empréstimos entram nas próximas etapas.
