# 📊 Metrika — Micro-SaaS de Dashboards de Dados

Um **micro-SaaS de analytics** construído em **Next.js 16 + React 19 + TypeScript**: o usuário importa seus dados
(CSV / planilha) e a plataforma gera **dashboards interativos**, com **autenticação**, **assinatura** e um
**agente de IA** que sugere análises.

> ⚠️ **Aviso sobre os dados**
> Todos os dados presentes neste repositório (planilhas, seeds, exemplos) são **fictícios** e foram
> **gerados aleatoriamente apenas para demonstração**. Os dados reais da operação em que o projeto
> foi utilizado são **confidenciais e estão protegidos** — nenhum dado real, credencial ou informação
> de terceiros foi incluído aqui.

## 🎯 Funcionalidades
- **Autenticação** por sessão + **onboarding** de usuário.
- **Importação de dados** (CSV via `papaparse`, conexão com planilhas).
- **Dashboards** com gráficos em **Recharts** e widgets configuráveis.
- **Agente de IA** (`/api/ai/agent`) integrado a IA generativa para sugerir análises.
- **Billing / assinatura** e painel **admin**.
- Persistência com **Prisma + SQLite**.

## 🧑‍💻 Stack
`Next.js 16` · `React 19` · `TypeScript` · `Prisma` · `SQLite` · `Recharts` · `TailwindCSS` · `IA Generativa`

## ▶️ Como rodar
```bash
npm install
copy .env.example .env      # configure DATABASE_URL e chaves de IA
npx prisma migrate dev
node prisma/seed.js         # popula dados de demonstração (fictícios)
npm run dev                 # http://localhost:3000
```
> Os arquivos em `public/data/*.json` são **dados de demonstração fictícios**.

## 📁 Estrutura
```
src/app/            # rotas (dashboard, api, admin, auth...)
prisma/schema.prisma# modelos (User, Session, Widget, Subscription...)
public/data/        # dados de exemplo (fictícios)
```

---

### 🧰 Competências demonstradas
`Next.js` · `React` · `TypeScript` · `Prisma` · `Data Viz` · `SaaS` · `IA`

### 👤 Autor
**José Vitor Santos Pinheiro** — Analista de Dados / BI / Ciência de Dados
· vytorsantt@gmail.com
