# Julius Assessoria financeira pessoal via WhatsApp

Julius é um sistema web de assessoria financeira pessoal que funciona integrado ao
WhatsApp através do N8N. O usuário conversa com um agente de IA pelo WhatsApp; cada
mensagem é processada por um fluxo no N8N que extrai os dados financeiros e os envia,
via webhook autenticado, para este sistema que persiste tudo em banco de dados real
e exibe em um painel completo, em tempo real.

> O WhatsApp é o **canal de entrada**. O site é o **painel de controle e visualização**.
> (Sim, o nome é uma homenagem carinhosa ao pai do Chris. Cada centavo conta.)

---

## Stack

| Camada        | Tecnologia |
| ------------- | ---------- |
| Framework     | [TanStack Start](https://tanstack.com/start) v1 (React 19 + SSR + server functions) |
| Build         | Vite 7 |
| Estilo        | Tailwind CSS v4 (design system em `src/styles.css`, tokens `oklch`) |
| UI            | shadcn/ui + Radix + lucide-react |
| Gráficos      | Recharts |
| Backend       | Lovable Cloud (PostgreSQL + Auth + Realtime + secrets), sob o capô Supabase |
| Datas / i18n  | date-fns (pt-BR) |
| Validação     | Zod |
| Testes        | Vitest |
| Deploy        | Lovable (deploy automático no push para `main`) |

---

## Como rodar localmente

Pré-requisitos: [Bun](https://bun.sh) (ou Node 20+) instalado.

```bash
# 1. Instalar dependências
bun install

# 2. Variáveis de ambiente
# O template já traz um .env com as chaves públicas do backend (VITE_SUPABASE_*).
# Para a criação automática de instância/QR Code, configure no backend:
#   EVOLUTION_API_URL   -> URL global da Evolution API
#   EVOLUTION_API_KEY   -> API Key global da Evolution API
# (na Lovable, esses valores são secrets — nunca vão para o código.)

# 3. Rodar em desenvolvimento
bun run dev            # http://localhost:8080

# 4. Testes
bunx vitest run

# 5. Typecheck + build
bunx tsc --noEmit
bun run build
```

### Testando o webhook manualmente

```bash
curl -X POST "http://localhost:8080/api/public/webhook/<nome-da-instancia>" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <webhook_secret da tela Integração>" \
  -d '{
    "tipo": "receita",
    "valor": 700,
    "categoria": "serviços",
    "metodo_pagamento": null,
    "descricao": "Recebimento de cliente",
    "data": "2026-06-24",
    "hora": "10:58:15",
    "resposta_usuario": "Registrei sua receita de R$ 700!"
  }'
```

---

## Automação: obter o `webhook_secret` dinamicamente no N8N

Para não precisar copiar/colar o `webhook_secret` de cada instância manualmente,
existe um endpoint interno **exclusivo para automação server-to-server**:

```
POST /api/public/instance-config/<NOME_INSTANCIA>
```

- Protegido pelo segredo mestre **`N8N_MASTER_KEY`** (diferente do `webhook_secret`
  por instância), enviado no header `x-master-key` (ou `Authorization: Bearer ...`).
- O master key é validado **antes de qualquer leitura**.
- Retorna apenas `{ instance_id, webhook_secret }` da instância pelo nome.
- Não aparece em nenhuma UI. Se a instância não existir (ou a chave for inválida),
  retorna 404/401 genéricos, sem detalhar o motivo — sem enumeração.

### 1. Configurar o secret `N8N_MASTER_KEY` na Lovable

Adicione o secret `N8N_MASTER_KEY` no ambiente da Lovable (Backend → Secrets).
Use um valor aleatório e forte, guardado apenas no N8N e na Lovable.

### 2. Chamar no N8N (nó HTTP Request antes do webhook principal)

Configure um primeiro nó **HTTP Request** que busca o `webhook_secret` a partir do
`NOME_INSTANCIA`:

```
Method:  POST
URL:     https://<seu-app>.lovable.app/api/public/instance-config/{{ $json.NOME_INSTANCIA }}
Headers: x-master-key: <valor do N8N_MASTER_KEY>
```

A resposta é:

```json
{ "instance_id": "…", "webhook_secret": "…" }
```

Em seguida, no nó HTTP Request que faz o POST principal para o webhook, use o valor
retornado para alimentar o header dinamicamente:

```
URL:     https://<seu-app>.lovable.app/api/public/webhook/{{ $json.NOME_INSTANCIA }}
Headers: x-webhook-secret: {{ $node["HTTP Request"].json.webhook_secret }}
```

### Testando manualmente

```bash
curl -X POST "http://localhost:8080/api/public/instance-config/<nome-da-instancia>" \
  -H "x-master-key: <N8N_MASTER_KEY>"
```

---

## Estrutura de pastas

```
src/
├── routes/
│   ├── __root.tsx                  # shell, tema, fontes, toaster, auth listener
│   ├── index.tsx                   # redireciona para /dashboard
│   ├── auth.tsx                    # login / cadastro
│   ├── sitemap[.]xml.ts            # sitemap
│   ├── api/public/
│   │   ├── webhook.$instance.ts    # endpoint público autenticado do N8N
│   │   └── instance-config.$instance.ts  # automação: resolve webhook_secret por nome (x-master-key)
│   └── _authenticated/             # subárvore protegida (gate de sessão)
│       ├── route.tsx               # guarda de autenticação (ssr:false)
│       ├── onboarding.tsx          # configuração inicial da instância
│       ├── conectar.tsx            # QR Code estilo WhatsApp Web + polling
│       └── _app.tsx                # layout com sidebar + guarda de instância
│           ├── _app.dashboard.tsx
│           ├── _app.conversas.tsx
│           ├── _app.financeiro.tsx
│           ├── _app.integracao.tsx
│           └── _app.configuracoes.tsx
├── lib/
│   ├── evolution.functions.ts      # server functions (Evolution API)
│   ├── finance.ts                  # cálculos puros (totais, agrupamentos, filtros)
│   ├── webhook-payload.ts          # schema + normalização do payload do N8N
│   ├── csv.ts / format.ts          # export CSV e formatação pt-BR
├── hooks/                          # use-app-data, use-transactions, use-theme
└── components/                     # FilterBar + shadcn/ui
tests/                              # finance.test.ts, webhook.test.ts
```

---

## Decisões de arquitetura

### Por que Lovable Cloud (Supabase)
- **Autenticação nativa** (e-mail/senha) sem escrever backend de auth.
- **Row Level Security**: cada usuário só enxerga seus próprios dados. Transações e
  mensagens são protegidas por uma função `owns_instance()` (`SECURITY DEFINER`) que
  verifica se a instância pertence ao usuário logado — mesmo padrão recomendado de
  helpers de RLS (como `has_role`).
- **Realtime**: `transactions`, `messages` e `instances` publicam mudanças; as telas de
  Dashboard e Conversas se atualizam sem refresh.
- **Migrations versionadas**: todo o schema está em migrations SQL, então trocar de
  banco depois é só re-aplicar os arquivos.

### Estrutura de tabelas
- `profiles` — espelha `auth.users` (nome, tema, moeda, fuso). Criado por trigger no signup.
- `instances` — o **vínculo imutável** com a instância do N8N/Evolution (nome + número).
  Guarda `webhook_secret` gerado no banco, usado para autenticar o webhook.
- `transactions` — lançamentos financeiros ligados à instância (não ao usuário direto),
  refletindo que a origem dos dados é a instância do WhatsApp.
- `messages` — log das conversas (mensagem original + `resposta_usuario` do agente).
- `categories` — categorias por usuário (cor/ícone/tipo), com um conjunto padrão semeado
  no signup via trigger.

### Por que o webhook é `/api/public/webhook/$instance`
O prefixo `/api/public/*` do TanStack Start ignora a autenticação de sessão (é chamado
por um servidor externo, o N8N). A segurança é feita **dentro do handler**: valida o
`x-webhook-secret` contra o segredo da instância antes de qualquer escrita, e usa o
cliente admin (service role) apenas após a validação.

### Por que server functions para a Evolution API
A URL e a API Key globais do provedor são secrets **server-only**. As chamadas de criar
instância / gerar QR / checar status ficam em `createServerFn` (`evolution.functions.ts`),
nunca expondo credenciais ao navegador. Todas têm timeout (`AbortController`) para não
travar a UI caso o provedor esteja lento.

### Lógica pura e testável
Cálculos de totais, agrupamentos, filtros e normalização do payload vivem em
`src/lib/finance.ts` e `src/lib/webhook-payload.ts` — funções puras compartilhadas entre
a UI e os testes, garantindo que "o que o dashboard mostra" é exatamente "o que os testes
verificam".

---

## Testes automatizados

`bunx vitest run` cobre:
- **Webhook**: validação do payload do N8N (aceita o formato canônico, rejeita `tipo`
  inválido, aceita payload só de mensagem) e normalização em linhas de banco.
- **Totais do dashboard**: soma de receitas/despesas/saldo, lidando com valores em string.
- **Filtros**: por data, categoria, tipo, faixa de valor e palavra-chave.

---

## CI/CD

`.github/workflows/ci.yml` roda em todo push/PR para `main`: instala deps, typecheck,
testes e build. Merge em `main` dispara o deploy automático da Lovable. O job `deploy`
documenta o ponto de extensão para hosts externos (Cloudflare/Vercel) em self-hosting.

---

## Vibe Coding Journal

Registro honesto de como foi construir o Julius com IA.

### Prompts que funcionaram melhor
- **Especificar o formato exato do JSON do webhook** logo de cara evitou retrabalho — a
  IA modelou `transactions` e `messages` diretamente a partir do payload real.
- **"Modelo de dados sugerido (ajustar livremente)"** deu liberdade para melhorar o schema
  (ex.: `webhook_secret` por instância, gerado no banco em vez de inventado no código).
- **Pedir funções puras + testes** ("cálculo dos totais e filtros") levou naturalmente a
  extrair `finance.ts` e `webhook-payload.ts`, deixando o código testável de verdade em
  vez de lógica presa dentro de componentes.

### Onde a IA errou / alucinou e como foi corrigido
- **Senha de teste vazada (HIBP)**: com a proteção contra senhas vazadas ligada, o cadastro
  automatizado falhava com `422`. Diagnóstico só veio ao ler o erro de rede trocar por
  uma senha forte resolveu. Lição: erros "silenciosos" de auth muitas vezes são política
  de senha, não bug de código.
- **Chamada à Evolution API travando a UI**: o botão de onboarding ficava eternamente em
  "carregando" porque o `fetch` ao provedor externo não tinha timeout. Corrigido com um
  `fetchWithTimeout` (`AbortController`) em todas as chamadas a UI sempre conclui, mesmo
  se o provedor estiver fora.
- **Route tree do TanStack**: ao criar rotas novas, o typecheck acusava paths inexistentes
  até o `routeTree.gen.ts` ser regenerado (reinício do dev server). Não editar o arquivo
  gerado só criar os arquivos de rota e deixar o plugin regenerar.
- **RLS em `transactions`/`messages`**: como essas tabelas se ligam ao usuário via
  `instance_id` (e não `user_id` direto), foi preciso uma função `owns_instance()`
  `SECURITY DEFINER` para as policies, em vez de comparar `auth.uid()` diretamente.

---

Feito com carinho e um pouquinho de inspiração no pai do Chris. 💸

---

## Integrações de agentes de IA (MCP)

O Julius expõe um servidor **MCP (Model Context Protocol)** para que assistentes de
IA (ChatGPT, Claude, Cursor, Codex, etc.) consultem seus dados financeiros com
segurança, em seu nome.

- **Endpoint:** `/mcp` (ex.: `https://juliusacessor.lovable.app/mcp`)
- **Autenticação:** OAuth 2.1 via Lovable Cloud. Ao conectar, o cliente abre a tela de
  consentimento; após aprovar, ele acessa apenas os seus dados (protegidos por RLS).
- **Ferramentas disponíveis:**
  - `financial_summary` — totais de receitas, despesas, saldo e principais categorias de gasto.
  - `list_transactions` — lista de lançamentos, com filtros por tipo e período.
  - `list_categories` — categorias do usuário.

### Como conectar
Adicione o servidor MCP no seu cliente de IA usando a URL `/mcp` do app. O cliente cuida
do fluxo OAuth automaticamente (registro dinâmico + login + consentimento). Não é
necessário copiar tokens manualmente.
