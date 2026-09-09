# Manual de Instalação

## Requisitos

- Python 3.10 ou superior (`sqlite3` já é nativo, sem dependências externas).

## Passo a passo

1. Clone o repositório.
2. Na raiz do projeto, rode:

   ```bash
   python -m app.main
   ```

3. Acesse `http://127.0.0.1:8000` no navegador.

O front-end estático é servido pelo próprio backend, que expõe as rotas
`/api/*`. A rota `/api/status` confirma que o backend está no ar e conectado
ao front-end.
