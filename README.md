# Secretária Virtual Juliana Pansardi

Aplicação fullstack em Next.js para atendimento administrativo, pré-agendamento e handoff humano para consultório de nutrição.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Supabase
- OpenAI API
- Resend
- Google Calendar API
- Vitest

## Rodando localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis

Preencha `.env.local` com:

- `OPENAI_API_KEY` e `OPENAI_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `TEAM_EMAIL`, `FROM_EMAIL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`

Sem credenciais, o app ainda abre e usa respostas administrativas determinísticas, mas não persiste em Supabase nem envia e-mail real.

## Supabase

1. Crie um projeto no Supabase.
2. Execute as migrations em `supabase/migrations`.
3. Ative Supabase Auth com e-mail/senha.
4. Crie um registro em `profiles` para o usuário administrador.

As rotas de backend usam `SUPABASE_SERVICE_ROLE_KEY`, então essa chave nunca deve ser exposta no frontend.

## OpenAI

O endpoint `/api/chat` chama a OpenAI apenas no backend. A saída é estruturada e depois passa por guardrails determinísticos para bloquear pedidos clínicos, dieta, suplementos, exames e diagnóstico.

## Resend

Configure `RESEND_API_KEY`, `FROM_EMAIL` e `TEAM_EMAIL`. O sistema tenta notificar a equipe quando há lead qualificado ou handoff humano.

## Google Calendar

O MVP opera em modo seguro:

- consulta disponibilidade via `/api/calendar/availability`;
- cria agendamentos internos via `/api/appointments`;
- só cria evento real se `createGoogleEvent` for enviado e as credenciais existirem.

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run lint
```

## Deploy na Vercel

1. Importe o projeto na Vercel.
2. Configure todas as variáveis de ambiente.
3. Garanta que as migrations do Supabase foram aplicadas.
4. Rode o deploy.

## Escopo implementado

- Landing page responsiva com chat próprio.
- Endpoint `/api/chat` com persistência, knowledge base, IA, guardrails e notificação.
- CRUD básico de knowledge base.
- Painel `/admin` com dashboard, leads, conversas, agenda, base e configurações.
- Integração segura com disponibilidade de Google Calendar.
- Migrations Supabase.
- Testes unitários de guardrails, estado, validação e e-mail.
