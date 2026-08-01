# Project Kyra — Sistema de Controle de Aulas

## Setup

1. Instalar dependências:

   ```bash
   npm install
   ```

2. Criar `.env.local` a partir do exemplo:

   ```bash
   cp .env.local.example .env.local
   ```

   No painel do Supabase, vá em **Project Settings > API Keys** e
   use a aba **"Publishable and secret API keys"** (não a aba
   "Legacy API Keys"):

   - `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` — URL do projeto.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — chave `sb_publishable_...`
     (substitui a antiga anon key; pode ficar exposta no client).
   - `SUPABASE_SECRET_KEY` — chave `sb_secret_...` (substitui a
     antiga service_role key; NUNCA prefixar com `NEXT_PUBLIC_`).
   - `SUPABASE_JWKS_URL` — endpoint JWKS do projeto, usado caso
     você precise validar JWTs manualmente fora das libs oficiais
     do Supabase (a lib `@supabase/ssr` já faz isso internamente,
     então esta variável não é chamada em nenhum código ainda —
     está reservada para uso futuro).

   Se o seu projeto Supabase ainda só tem as chaves legacy
   (`anon`/`service_role`), clique em "Create new API keys" na
   mesma tela para gerar as novas — as legacy continuam funcionando
   em paralelo, então não há downtime.

3. Rodar as migrations no Supabase (SQL Editor do painel, ou via
   CLI com `supabase db push`), na ordem:

   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_handle_new_user.sql`

4. Rodar o projeto:

   ```bash
   npm run dev
   ```

5. Acessar `http://localhost:3000` — deve redirecionar para
   `/login`. Criar uma conta em `/signup` para testar o fluxo
   completo.

## Stack atualizado

- Next.js 16.2 (App Router), React 19.2.
- `src/proxy.ts` — antigo `middleware.ts`, renomeado conforme a
  migração oficial do Next 16 (middleware → proxy).
- Autenticação via Supabase Auth com o novo padrão de chaves
  (`publishable`/`secret`, ver seção de Setup acima).
- UI com shadcn/ui (`components.json` já configurado — para
  adicionar novos componentes: `npx shadcn@latest add <componente>`).

## O que já está implementado

- Auth (login/signup) com Supabase Auth + proxy protegendo
  `/dashboard`, `/students`, `/calendar`, `/packages`.
- Dashboard mínimo (Server Component) listando alunos do professor
  logado.
- API de alunos: `GET /api/students` e `POST /api/students`
  (RF01), com `email` obrigatório e `whatsapp` opcional.
- Página pública `/share/[token]` (RF08), usando a secret key
  server-side com validação manual do token.

## O que falta (próximos passos sugeridos)

- CRUD de pacotes (RF02, RF07).
- Calendário privado com FullCalendar, agendamento (RF03),
  remarcação (RF04) e cancelamento (RF05), respeitando a
  constraint de não sobreposição já criada no banco.
- Marcar aula como concluída e debitar crédito do pacote (RF06).
- Conversão de fuso horário no client da página pública.
- Tela de configurações do professor para editar o `timezone`.
