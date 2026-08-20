# TrabalhoBC

Estrutura inicial do projeto com frontend em HTML/CSS/JavaScript, backend em
Python e pasta reservada para scripts/configuracoes do SQL Server.

## Estrutura

```text
backend/
  python/
    main.py

database/
  sqlserver/

frontend/
  html/
    index.html
  css/
    main.css
  js/
    main.js
```

## Como executar

Na raiz do projeto, execute:

```bash
python backend/python/main.py
```

Depois acesse:

```text
http://127.0.0.1:8000
```

O HTML carrega o CSS e o JavaScript. O JavaScript consulta o backend em Python
pela rota `/api/status`. A conexao com o SQL Server sera adicionada em uma etapa
posterior.
