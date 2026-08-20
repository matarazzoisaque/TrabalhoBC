# TrabalhoBC

Projeto academico de uma urna para votacao dos melhores professores, usando
frontend em HTML/CSS/JavaScript, backend em Python com POO e DAO, e banco de
dados SQL Server.

## Estrutura Base

```text
backend/
  abstrato/
  banco_dados/
  controle/
  dao/
  modelo/
  validacao/

frontend/
  html/
  css/
  js/
  assets/

banco_dados/
  sql_server/
```

As pastas `controle/` e `validacao/` foram planejadas como camadas separadas
para receber as classes especificas de cada parte do sistema durante o
desenvolvimento.

## Execucao Inicial

```bash
python backend/main.py
```

Depois acesse:

```text
http://127.0.0.1:8080
```

O arquivo `frontend/html/index.html` carrega `frontend/css/main.css` e
`frontend/js/main.js`. O JavaScript consulta o backend Python pelas rotas
`/api/status` e `/api/professores`.
