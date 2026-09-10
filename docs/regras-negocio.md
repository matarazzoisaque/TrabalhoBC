# Regras de Negócio

Regras aplicadas nesta etapa do projeto. Todas ficam em
`app/services/livro_service.py`, antes de qualquer dado chegar ao banco.

## Cadastro de livro

| # | Regra | Retorno quando desrespeitada |
|---|---|---|
| RN01 | O **título** é obrigatório e não pode ser apenas espaços | `400` — "O campo título é obrigatório." |
| RN02 | O **título** tem no máximo 200 caracteres | `400` — "O campo título deve ter no máximo 200 caracteres." |
| RN03 | O **autor** é obrigatório e não pode ser apenas espaços | `400` — "O campo autor é obrigatório." |
| RN04 | O **autor** tem no máximo 150 caracteres | `400` — "O campo autor deve ter no máximo 150 caracteres." |
| RN05 | O **ano de publicação** é obrigatório | `400` — "O campo ano de publicação é obrigatório." |
| RN06 | O **ano de publicação** precisa ser um número inteiro | `400` — "O ano de publicação deve ser um número inteiro." |
| RN07 | O **ano de publicação** fica entre 1450 e o ano seguinte ao atual | `400` — "O ano de publicação deve estar entre 1450 e AAAA." |
| RN08 | Espaços sobrando no início e no fim dos textos são removidos antes de gravar | — |
| RN09 | Não existem dois livros com o mesmo título **e** o mesmo autor | `503` — erro de unicidade devolvido pelo banco |

O limite inferior de 1450 corresponde ao início da imprensa de tipos móveis;
o limite superior é o ano seguinte ao atual, para aceitar livros com data de
publicação já anunciada.

A regra RN09 é garantida pela restrição `uq_livros_titulo_autor`, definida em
`database/ddl.sql`.

## Listagem do acervo

| # | Regra |
|---|---|
| RN10 | Os livros são listados em ordem alfabética de título |

## Próximas etapas

Leitores, exemplares e empréstimos ainda não fazem parte do sistema. Suas
regras (prazo de devolução, limite de empréstimos por leitor e controle de
status do exemplar) serão detalhadas quando as entidades forem criadas.
