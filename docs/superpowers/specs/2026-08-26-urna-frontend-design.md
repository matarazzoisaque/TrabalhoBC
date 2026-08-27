# Plataforma de Votação "Melhor Professor" — Frontend (Console de Apuração)

Data: 2026-08-26
Status: aprovado para planejamento de implementação

## 1. Contexto e escopo

O repositório `TrabalhoBC` hoje contém:

- `backend/` — esqueleto Python (POO: `abstrato/`, `controle/`, `modelo/`, `validacao/`) servindo o frontend estático via `http.server`. **Não será alterado neste projeto.**
- `banco_dados/sql_server/` — hoje contém apenas `script_criacao_tabelas.sql` vazio. **Será complementado** (não recriado do zero) com o schema completo.
- `frontend/` — HTML/CSS/JS puro. **Será apagado por completo** e substituído por uma aplicação Next.js.

Este spec cobre exclusivamente a reconstrução do frontend como uma aplicação Next.js completa, com dados mockados, mais os artefatos de preparação (tipos/contratos de integração futura e scripts SQL Server). **Nenhuma API Python será implementada agora.**

## 2. Stack técnica

- Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui (componentes totalmente customizados, não usados com aparência padrão) + Lucide Icons.
- Gerenciador de pacotes: `npm` (único disponível no ambiente; Node 24 / npm 11 confirmados).
- Temas claro/escuro via `next-themes`, com tokens CSS próprios (não é apenas inversão de cores).
- State management: **React Context + hooks customizados** por domínio (`useAuth`, `useVotacao`, `useAdminProfessores`, `useAdminAlunos`) — sem dependências extras de estado global.
- Persistência mockada: `localStorage` (via um `mockDb` interno a `mocks/`) para que votos e alterações de CRUD sobrevivam a um reload durante demonstração, com função de seed/reset.
- Toda leitura/escrita de dados passa pela camada `services/` (nunca os componentes acessam `mocks/` diretamente) — isso é o que torna a troca futura por chamadas HTTP a uma API Python trivial.

## 3. Estrutura de pastas (dentro de `frontend/`)

```
frontend/
  app/
    (auth)/login/page.tsx
    (urna)/votar/page.tsx
    (admin)/admin/page.tsx                # dashboard/resumo
    (admin)/admin/alunos/page.tsx         # CRUD alunos
    (admin)/admin/professores/page.tsx    # CRUD professores
    (admin)/admin/telao/page.tsx          # modo apresentação (protegido)
    layout.tsx, globals.css
  components/
    ui/        # primitivos shadcn, restilizados (cores, sombras, bordas, estados)
    urna/      # UrnaShell, TelaUrna, TecladoNumerico, BotaoAcao, DisplayNumerico
    admin/     # StatCard, RankingTable, CrudTable, FormModal/Drawer
    telao/     # RankingTelao, DestaquePrimeiroLugar
    shared/    # ThemeToggle, LoadingState, ErrorState, EmptyState
  layouts/     # KioskLayout, AdminLayout, TelaoLayout
  hooks/       # useAuth, useVotacao, useAdminProfessores, useAdminAlunos
  lib/         # httpClient.ts (fetch wrapper, base URL configurável), utils.ts, constants.ts
  types/       # usuario.ts, professor.ts, voto.ts, resultado.ts, configuracaoVotacao.ts, api.ts
  services/    # interfaces + implementação mock (auth, professores, votos, resultados, admin)
  mocks/       # dados mockados + mockDb.ts (persistência localStorage) + delay.ts (simula latência)
  validators/  # validação de formulários (RA, senha, CRUD admin)
  public/assets/
```

## 4. Fluxos de tela

### 4.1 Login (`(auth)/login`)
Campo RA + senha, validação visual, loading, erro, tema claro/escuro. **Login único**: após autenticar via `services/authService` (mockado), o sistema verifica o perfil retornado (`ALUNO` | `ADMIN`) e redireciona automaticamente — aluno para `/votar`, admin para `/admin`. Não existem duas telas de login.

### 4.2 Urna (`(urna)/votar`) — protegida para perfil ALUNO
Console central com visor recuado (número digitado, nome/disciplina do professor buscado por número via mock), teclado numérico, botões **BRANCO / CORRIGE / CONFIRMA**, confirmação antes do envio, estados de voto confirmado / já votado / votação encerrada, e possibilidade de reiniciar o fluxo. Suporte a teclado físico (desktop) e `inputMode="numeric"` para teclado nativo em mobile.

### 4.3 Painel administrativo (`(admin)/admin`) — protegido para perfil ADMIN
Resumo da votação (total de votos, professores/alunos cadastrados, status aberta/encerrada), ranking, indicadores visuais, botões abrir/encerrar votação, CRUD visual de alunos e professores (modais/drawers), estados de vazio/carregamento/erro.

### 4.4 Modo Telão (`(admin)/admin/telao`) — protegido, dentro do admin
**Ajuste sobre o brief original**: em vez de uma rota pública de apresentação, o telão é uma tela acessada de dentro do painel administrativo (botão "Abrir modo Telão"), exigindo a mesma sessão de admin. Ao abrir, assume um layout próprio de tipografia grande e alto contraste via `TelaoLayout`, com toggle de Fullscreen API para projeção. Mostra ranking, votos e percentuais, destaque do 1º colocado, atualização simulada por polling do mock store. **Nunca exibe RA, senha ou dados pessoais dos votantes.**

## 5. Identidade visual — "Console de Apuração"

Metáfora: um instrumento de painel físico (carcaça + visor recuado + teclado em relevo), não um formulário web nem a urna oficial (sem logotipos/brasões/identidade do TSE).

### Paleta (tokens nomeados — o visor é sempre escuro/"tinta" nos dois temas; só a carcaça muda de material)

| Token | Claro — "Papel & Instrumento" | Escuro — "Sala de Apuração" |
|---|---|---|
| `--bg` | `#F3F1EA` | `#14151A` |
| `--surface` (carcaça) | `#E7E2D3` | `#2B2C31` |
| `--screen` (visor, fixo) | `#12140F` | `#0A0F0D` |
| `--ink` (texto) | `#23241F` | `#ECE8DD` |
| `--accent-confirm` | `#12805F` | `#22C08E` |
| `--accent-warn` | `#A85D00` | `#F0A93B` |
| `--accent-danger` | `#B23A3A` | `#F0605F` |
| `--accent-focus` | `#1B4B4F` | `#4FD1D9` |

### Tipografia
- `Space Grotesk` — títulos e UI de destaque.
- `JetBrains Mono` (`tabular-nums`) — todo número: dígito digitado, contagem de votos, ranking, percentuais.
- `IBM Plex Sans` — corpo de texto e UI geral.

### Elemento-assinatura
O **visor com glow semântico**: os dígitos trocam de cor conforme o estado (neutro ao digitar, âmbar ao corrigir, jade ao confirmar, coral no erro), acompanhados por uma fita de status no topo do console que pulsa na mesma cor. O mesmo motivo se repete no destaque de cards do admin e no destaque do 1º colocado no telão, unificando a identidade visual do produto.

### Microinterações
Botões com sombra em relevo; ao clicar, `scale(0.97)` + sombra interna simulando tecla física pressionada (~120ms). Toda animação é desativada sob `prefers-reduced-motion`.

## 6. Acessibilidade e responsividade

- Navegação por teclado completa, foco visível, labels adequados, contraste AA mínimo nos dois temas.
- Mobile: `inputMode="numeric"` no campo de número, áreas de toque confortáveis (mín. 44px), sem quebra de layout, sem necessidade de zoom.
- Mensagens de erro compreensíveis, estados acessíveis (`aria-*`) em botões e nos estados de carregamento/sucesso/erro.

## 7. Camada de integração com futura API Python

- `types/`: `Usuario`, `Professor`, `Voto`, `Resultado`, `ConfiguracaoVotacao`.
- `services/`: uma interface por domínio + implementação mock; comentários `// TODO(api-python):` marcando onde a implementação HTTP real entrará.
- `lib/httpClient.ts`: cliente HTTP fino, lendo `NEXT_PUBLIC_API_URL` (variável de ambiente, sem valor real commitado) — pronto para uma API em Python puro (sem Flask/FastAPI/Django/Node).
- Tratamento uniforme de loading/sucesso/erro/timeout nos hooks de domínio.
- Contratos de endpoint (rota, payload, resposta, erros esperados) documentados em comentário junto de cada método de serviço.

## 8. Banco de dados SQL Server (`banco_dados/sql_server/`)

Complementar a pasta existente com scripts numerados:

- Tabelas: `usuarios` (RA único, perfil `ALUNO`/`ADMIN`, ativo/inativo), `professores`, `votos` (`UNIQUE` em `usuario_id` — impede voto duplicado), `configuracao_votacao` (status aberta/encerrada), `auditoria`.
- Chaves primárias/estrangeiras, índices, constraints de integridade.
- Script de dados iniciais para desenvolvimento (seed).
- Arquivo de exemplo de conexão (`.env.example`-like, sem credenciais reais: servidor, banco, usuário, senha, porta).
- README documentando o schema e como aplicar os scripts.

## 9. Fases de implementação

Segue o roteiro do briefing original (FASE 1 é este próprio documento):

1. ~~Inspeção e proposta de arquitetura~~ (concluída — este spec)
2. Setup do projeto (Next.js, Tailwind, shadcn, fontes, temas)
3. Design system e identidade visual (tokens, componentes `ui/` customizados)
4. Tela de login
5. Urna responsiva + teclado numérico + fluxo de votação mockado
6. Painel administrativo (resumo, ranking, CRUD)
7. Modo Telão (dentro do admin)
8. Camada de integração preparada para API Python
9. Scripts e documentação do banco SQL Server
10. Revisão final (responsividade, acessibilidade, temas, animações, build/typecheck)

Cada fase é entregue, validada (build + typecheck) e aguarda confirmação antes de iniciar a próxima mudança estrutural relevante.

## 10. Critérios de aceite

Os mesmos definidos no briefing original: todas as telas mockadas funcionais, teclado visual + teclado numérico nativo mobile, botões BRANCO/CORRIGE/CONFIRMA coerentes, temas claro/escuro completos e com identidade própria, painel admin e modo telão visualmente completos, camada de integração e tipos documentados, scripts SQL Server com a restrição de voto único por `usuario_id`, projeto funcionando em desktop/mobile, build e typecheck sem erros, README explicando instalação, execução e futura conexão com o backend Python puro.
