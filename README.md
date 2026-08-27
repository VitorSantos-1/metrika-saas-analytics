# Metrika — Micro-SaaS de Dashboards de Dados

Plataforma de analytics no modelo micro-SaaS construida em Next.js 16, React 19 e TypeScript: o
usuario importa seus dados (CSV ou planilha) e a aplicacao gera dashboards interativos, com
autenticacao, paginas publicas por usuario, controle de assinatura e um agente de IA que sugere
analises. E um projeto full-stack de ponta a ponta — do banco de dados a interface — que demonstra a
capacidade de transformar dado bruto em um produto de visualizacao utilizavel por quem nao e tecnico.

> **Nota de confidencialidade:** todos os dados presentes neste repositorio (planilhas, seeds,
> exemplos) sao ficticios, gerados apenas para demonstracao. Nenhum dado real, credencial ou
> informacao de terceiros foi incluido aqui.

---

## Visao Geral

O Metrika resolve a distancia entre "ter uma planilha" e "ter um painel". Em vez de depender de uma
ferramenta de BI e de alguem que saiba modela-la, o proprio usuario sobe seu CSV, escolhe os widgets
e publica um dashboard — inclusive em uma pagina publica compartilhavel. A aplicacao cobre todo o
ciclo de um produto SaaS: cadastro e login, onboarding, limites por plano, cobranca e um agente de IA
que interpreta os dados e sugere o que analisar.

## Contexto de Negocio

A demanda por visualizacao de dados cresce mais rapido do que a disponibilidade de analistas. Times
comerciais, pequenas operacoes e areas de negocio precisam acompanhar indicadores, mas esbarram na
barreira tecnica de montar e manter dashboards. Um produto que permite ao proprio usuario importar
dados e publicar um painel — com autoatendimento e cobranca por plano — ataca exatamente essa lacuna,
e e o tipo de solucao que o mercado remunera como produto, nao como relatorio pontual.

## O Problema que Resolve

- **Dependencia de especialista** para transformar planilha em painel.
- **Falta de compartilhamento simples:** relatorios presos em arquivos, sem link publico.
- **Ausencia de um caminho de autoatendimento** (cadastro, onboarding, limites e cobranca).
- **Curva de interpretacao:** o usuario tem o grafico, mas nao sabe qual analise priorizar.

## Publico e Decisoes Apoiadas

- **Usuario de negocio:** importa seus dados e acompanha indicadores sem depender de TI.
- **Gestor:** publica um painel com link para a equipe ou para terceiros.
- **Operador do produto (admin):** administra usuarios, planos e limites.

## Impacto e Valor Gerado

- Reduz o tempo entre "receber um CSV" e "ter um dashboard publicado" a poucos cliques.
- Habilita compartilhamento por link publico, ampliando o alcance da informacao.
- Estrutura um modelo de receita recorrente (planos e limites de uso).
- Adiciona uma camada de IA que reduz a barreira de "nao sei o que analisar".

---

## Arquitetura e Abordagem Tecnica

Aplicacao full-stack em Next.js (App Router) com renderizacao no servidor, Server Actions e rotas de
API dedicadas. A persistencia usa Prisma sobre SQLite, com migracoes versionadas.

### Autenticacao e multi-tenant
- Autenticacao por sessao (`src/lib/auth.ts`, `middleware.ts`) e fluxo de **onboarding** com escolha
  de nome de usuario (`/api/onboarding`).
- **Paginas publicas por usuario:** rotas dinamicas `[username]/[folder]` servem dashboards
  compartilhaveis, isolando o conteudo de cada conta.

### Ingestao e visualizacao
- **Importacao de dados** por CSV (papaparse) e conexao com planilhas (`/api/fetch-sheet`).
- **Dashboards** com graficos em Recharts e widgets configuraveis (`dashboard/widgets`).
- Organizacao por **pastas** e temas personalizaveis (`dashboard/folders`, `dashboard/themes`).

### Inteligencia
- **Agente de IA** (`/api/ai/agent`, `src/lib/ai.ts`) que analisa os dados e sugere analises, alem de
  uma rota de analise dedicada (`/api/analyze`).

### Produto e operacao
- **Assinatura e cobranca** (`dashboard/billing`) com **limites por plano** (`src/lib/plan-limits.ts`).
- **Painel administrativo** (`src/app/admin`) para gestao do produto.
- Modelos de dados em `prisma/schema.prisma` (usuario, sessao, widget, assinatura, entre outros).

## Stack

Next.js 16 - React 19 - TypeScript - Prisma - SQLite - Recharts - TailwindCSS - IA generativa -
Server Actions e API Routes.

## Como Rodar

```bash
npm install
copy .env.example .env      # configure DATABASE_URL e as chaves de IA
npx prisma migrate dev
node prisma/seed.js         # popula dados de demonstracao (ficticios)
npm run dev                 # http://localhost:3000
```

> Os arquivos em `public/data/*.json` sao dados de demonstracao ficticios.

## Estrutura do Projeto

```text
src/app/                 -> Rotas: dashboard, api, admin, auth, onboarding, paginas publicas
src/app/api/             -> Endpoints (auth, ai/agent, analyze, fetch-sheet, onboarding, settings)
src/app/dashboard/       -> Area logada (widgets, folders, billing, connections, stats, themes, upload)
src/components/          -> Componentes de UI (shell, header, sidebar, graficos publicos)
src/lib/                 -> Auth, IA, limites de plano, cliente Prisma
prisma/schema.prisma     -> Modelos de dados e migracoes
public/data/             -> Dados de exemplo (ficticios)
```

## Autor

Jose Vitor Santos Pinheiro — Analise de Dados e Inteligencia Comercial (Varejo e Supply Chain).
Contato: vytorsantt@gmail.com
