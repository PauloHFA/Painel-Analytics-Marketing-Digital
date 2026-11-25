# 📋 Pendências e Próximos Passos — Painel-Analytics-Marketing-Digital (GrowMetrics)

Auditoria técnica realizada comparando a especificação completa (`Projeto Freelancer Dashboard Analytics Personalizado para Agência de Marketing Digital.pdf`) com o código atual do monorepo (`packages/shared`, `apps/api`, `apps/web`, `database/`, `docker-compose.yml` e `.github/workflows/ci.yml`).

---

## 1. Estado Geral Verificado

- **Build & Tipagem (`npm run build`)**: Verde nos 3 workspaces (`@dashboard/shared`, `@dashboard/api`, `@dashboard/web`), com code-splitting (`React.lazy` + `manualChunks`), maior chunk em `180.01 kB` (zero alertas de tamanho).
- **Testes Unitários & HTTP (`npm test`)**: 40/40 testes passando (métricas, isolamento multitenant, autorização de gestor/CSV, AES-256-GCM, guarda RLS contra SQLi, CRUD clientes, exclusão LGPD, auditoria, granularidade semanal/mensal, alertas, CSV, AI Copilot, agendamentos, budget pacing, webhook CRM e origens GA4).
- **Critérios de Aceite (`npm run check:acceptance`)**: 5/5 aprovados (`1.96ms`).
- **Diagnóstico Arquitetural**: O projeto agora usa UUIDs padronizados alinhados com PostgreSQL, hardening HTTP (`helmet`, CORS configurável, `express-rate-limit`), validação estrita de `.env`, criptografia `AES-256-GCM`, trilha de auditoria, exclusão LGPD, acessibilidade tabular nos gráficos (RNF-08) e pool `pg` transacional com `SET LOCAL` RLS pronto. Restam apenas os fluxos que dependem de **Auth real** (JWT + Argon2/bcrypt + tela de login/convites), **worker Redis/BullMQ + PDF Playwright em servidor** e **credenciais/OAuth externas** (Google Cloud/Ads, Meta, SMTP/WhatsApp, PostgreSQL/Docker rodando).

---

## 2. Matriz de Conformidade por Requisito (PDF Seção 3)

### Requisitos Funcionais (RF)

| ID | Requisito | Status | Evidência / Lacuna |
|---|---|---|---|
| RF-01 | Conectar GA4, Google Ads, Meta Ads e Instagram Insights e sincronizar dados | **Parcial (Mock)** | `apps/api/src/connectors/index.ts` apenas filtra arrays em memória (`store`). Sem OAuth nem chamadas HTTP reais às APIs. |
| RF-02 | Gráficos interativos (tooltip, legenda clicável, detalhamento) com Chart.js | **Atendido** | `TrendChart.tsx` e `ChannelDonutChart.tsx` usam `chart.js` + `react-chartjs-2` com registros tree-shaken. |
| RF-03 | KPIs: CAC, ROI, CTR, conversões e engajamento com fórmulas formais | **Atendido** | `packages/shared/src/utils/metrics.ts` implementa as fórmulas e `metricsService.ts` agora soma `receitaManual` à receita base. |
| RF-04 | Filtros por período, cliente e canal | **Atendido** | `FilterBar.tsx` inclui presets (`7d`, `30d`, `90d`, `este_mes`, `mes_anterior`) + intervalo livre (`inicio`/`fim`) sincronizados com a URL; `canais` propagado para resumo, série, por-canal e campanhas. |
| RF-05 | Comparativo entre períodos (anterior e ano anterior) com variação absoluta e % | **Atendido** | Datas normalizadas em UTC em `metricsService.ts`. |
| RF-06 | Exportação em PDF com identidade visual da agência | **Parcial** | `ReportPrintView.tsx` agora aplica dinamicamente marca, logo, cores, fonte e rodapé via `/api/v1/agencia/marca`, mas ainda usa `window.print()` client-side em vez de Playwright/Chromium no servidor (`/relatorios/:id/download` ainda devolve JSON). |
| RF-07 | Login individual por cliente com acesso exclusivo aos próprios dados | **Parcial (Inseguro)** | Isolamento de leitura funciona por usuário simulado, mas não há tela de Login nem validação de senha em `POST /auth/login`. |
| RF-08 | Perfis: Admin, Gestor (clientes atribuídos) e Cliente (apenas o próprio) | **Atendido (In-memory)** | Leituras e rotas de escrita (`entradas`, `metas`, `agendamentos`, `testar`) agora validam vínculo do `gestor` via `usuarioTemAcessoAoCliente`. |
| RF-09 | Cadastro de clientes e usuários, convite por e-mail, recuperação de senha | **Parcial (Clientes OK / Auth Pendente)** | Endpoints `POST/PATCH /clientes` e `DELETE /clientes/:id/dados` implementados; faltam CRUD de usuários, `/auth/aceitar-convite` e `/auth/esqueci-senha` (dependem de Auth real e SMTP). |
| RF-10 | Tela de conexões por cliente com status, última sync e alerta de falha | **Atendido (Mock)** | `ConnectionsView.tsx` exibe status, erro e botão de sincronização manual contra o `store`. |
| RF-11 | Indicador de "atualizado há X minutos" em cada painel | **Atendido** | Exibido no `Header.tsx` com polling de 60s via TanStack Query em `App.tsx`. |
| RF-12 | Entradas manuais (receita, novos clientes, custos extras) por cliente | **Atendido (In-memory)** | `ManualEntriesView.tsx` + webhook CRM implementados, mas sem persistência em banco e com bug no webhook quando `novosClientes` é omitido. |
| RF-13 | Detalhamento por campanha e por publicação do Instagram | **Atendido (In-memory)** | `PaidAdsView.tsx`, `InstagramView.tsx` (`novosSeguidoresInstagram` real) e `GA4View.tsx` (agregação real via `GET /api/v1/ga4/origens`). |
| RF-14 | Personalização da marca (logo e cores) no painel e PDF | **Atendido (In-memory)** | `BrandSettingsView.tsx` inclui logo/fonte e invalida `['agencia-marca']`; `Header.tsx` e `ReportPrintView.tsx` aplicam a marca dinamicamente. |
| RF-15 | Agendamento e envio automático de relatórios por e-mail | **Parcial (Simulado)** | CRUD e botão de teste existem, mas não há scheduler (cron/BullMQ) nem integração SMTP/Resend/WhatsApp real. |
| RF-16 | Metas e alertas | **Atendido (In-memory)** | `AlertsView.tsx`, `alertService.ts` e rotas de metas/alertas implementados. |
| RF-17 | Exportação de dados em CSV | **Atendido (In-memory)** | `App.tsx` baixa CSV autenticado via `fetch` + header `x-user-id` (Blob) e `authMiddleware` também aceita `?token=`. |
| RF-18 | Extensibilidade para novos canais sem reescrever o sistema | **Atendido na arquitetura** | Interface `Conector` desacoplada em `packages/shared` e `apps/api/src/connectors`. |

### Requisitos Não Funcionais (RNF)

| ID | Categoria | Status | Evidência / Lacuna |
|---|---|---|---|
| RNF-01 | Desempenho (< 1.5s para 12 meses) | **Pendente validação em BD real** | Medido em 2.91ms apenas sobre array pequeno em memória. Precisa ser medido no PostgreSQL com massa de 60 clientes × 30 campanhas × 365 dias. |
| RNF-02 | Isolamento multitenant | **Parcial** | Testado em memória na camada Express. RLS está escrito em `001_initial_schema.sql`, mas nunca executado pela API nem testado com Testcontainers/Supertest. |
| RNF-03 | Segurança (JWT, Argon2/bcrypt, AES-GCM, OWASP, Auditoria) | **Parcial (Sem Auth real)** | Implementados `helmet`, `express-rate-limit`, CORS configurável, validação de `.env`, `AES-256-GCM` (`crypto.ts`) e trilha de `auditoria` (`GET /api/v1/auditoria`); faltam hash de senha e JWT real. |
| RNF-04 | Escalabilidade (60+ clientes) | **Parcial** | Schema SQL contempla índices e 60 clientes no seed; `pg` pool com RLS implementado em `postgres.ts`; falta ligar repositórios ao BD ativo e worker `Redis + BullMQ`. |
| RNF-05 | Manutenibilidade | **Atendido** | Monorepo TS bem estruturado, UUIDs unificados e documentado em `docs/`. |
| RNF-06 | Confiabilidade (reintentos, idempotência, alertas) | **Parcial** | `001_initial_schema.sql` define constraints `UNIQUE` para `UPSERT`, mas ainda não há worker com backoff exponencial nem reprocessamento incremental de 7–30 dias. |
| RNF-07 | Usabilidade (responsivo, tela cheia) | **Atendido** | Tailwind responsivo, dark mode, toasts não bloqueantes e botão fullscreen (`requestFullscreen()`). |
| RNF-08 | Acessibilidade (contraste, teclado, tabela alternativa aos gráficos) | **Atendido (Base)** | Adicionado alternador de **Tabela acessível** em `TrendChart` e `ChannelDonutChart`, além de atributos `aria-label` e `aria-expanded`. |
| RNF-09 | Privacidade / LGPD | **Parcial (Endpoint pronto)** | Implementado `DELETE /api/v1/clientes/:id/dados` para revogação de contas e limpeza de dados agregados do tenant; falta fluxo com tokens OAuth reais e termo de consentimento. |
| RNF-10 | Idioma (pt-BR) | **Atendido** | Textos, datas e formatação monetária em pt-BR. |

---

## 3. Bugs Corrigidos Nesta Revisão vs. Restantes

### Já corrigidos (validados por `npm run build` e 40 testes)
- **Migração completa para UUID**: `store.ts`, `ids.ts`, `002_initial_seed.sql` (corrigido prefixo inválido `u0000000-...` para `d0000000-...`), `schemas/index.ts` (validação `z.string().uuid()`), `AuthContext`, `FilterContext`, `Header`, `ReportsView`, `App.tsx`, testes e `acceptance_check.ts` alinhados com UUIDs v4 determinísticos e `randomUUID()`.
- **Hardening HTTP, `.env`, AES-256-GCM e Auditoria**: configurados `helmet`, `express-rate-limit`, CORS configurável via `env.ts`, criptografia `AES-256-GCM` (`utils/crypto.ts`), `pg` pool transacional com validação estrita de UUIDs em `postgres.ts`, `auditService.ts` + `GET /api/v1/auditoria`, CRUD de clientes (`POST/PATCH /clientes`) e exclusão LGPD (`DELETE /clientes/:id/dados`).
- **Acessibilidade, UX, Granularidade e Performance de Bundle**: adicionada agregação `dia` | `semana` | `mes` em `gerarSerieTemporal` + seletor na UI, tabela alternativa acessível em `TrendChart` e `ChannelDonutChart`, cores dinâmicas da marca em `TrendChart`, substituição de `alert()`/`confirm()` por `ToastContext` + confirmação inline, e code-splitting (`React.lazy` + `manualChunks`) eliminando chunks > 500 kB.
- **Exportação CSV, Webhook CRM, Receita Manual e Autorização de Gestor**: download autenticado via header, correção de `NaN` no webhook CRM, soma de `receitaManual`, validação de vínculo de `gestor` em rotas `POST/PUT`, `GET /api/v1/ga4/origens`, `novosSeguidoresInstagram` real e filtros sincronizados na URL.

### Ainda pendentes (dependem de Auth real / Banco ativo / Terceiros)
1. **Autenticação real (JWT + Argon2/bcrypt + tela de login + convites/reset de senha)**.
2. **Repositórios SQL conectados ao PostgreSQL ativo**: `postgres.ts` já tem pool e `executarComRLS`, restando migrar as leituras/escritas de `store.ts` para SQL quando o banco estiver rodando.
3. **Worker Redis/BullMQ + PDF Playwright em servidor + Conectores OAuth reais (Google/Meta)**.

---

## 4. Pendências de Engenharia (Backlog Técnico)

### Prioridade Alta (Obrigatório antes de Produção)
- [ ] **Persistência PostgreSQL + RLS (queries)**: pool `pg` e `executarComRLS` implementados em `apps/api/src/db/postgres.ts`, tabelas `metas_clientes`/`agendamentos_relatorios` adicionadas em `001_initial_schema.sql` e UUIDs alinhados em `002_initial_seed.sql`; falta substituir os acessos em memória de `store.ts` pelas queries SQL reais quando o Postgres estiver ativo.
- [ ] **Autenticação Real e RBAC**: implementar `bcrypt`/`argon2` para verificação de senha em `POST /api/v1/auth/login`, assinatura real de JWT de acesso curto + refresh token em cookie `httpOnly` (`POST /auth/refresh`, `/auth/logout`), remover fallback automático para admin padrão em `authMiddleware` e criar tela de Login no front-end.
- [x] **Corrigir bugs imediatos de autorização e cálculos**: vínculo de `gestor` validado nas rotas `POST/PUT`, download CSV autenticado via header, `WebhookCrmSchema` evitando `NaN` + suporte a `WEBHOOK_CRM_SECRET`, e soma de `receitaManual` em `metricsService.ts`.
- [x] **Hardening HTTP, `.env`, AES-256-GCM e Auditoria (sem Auth real)**: implementados `helmet`, `express-rate-limit`, CORS configurável, `env.ts` com Zod, `utils/crypto.ts` (AES-256-GCM) e `auditService.ts` + `GET /api/v1/auditoria`.
- [ ] **Worker Assíncrono (Redis + BullMQ)**: adicionar serviço `worker` no `docker-compose.yml` para sincronização periódica (GA4 15–30m, Ads 30–60m, Instagram 1–4x/dia), reintentos com backoff exponencial, reprocessamento de 7–30 dias, disparos agendados (RF-15) e geração de PDF.

### Prioridade Média (Completude Funcional do Escopo)
- [ ] **Conectores Reais das Plataformas**: implementar OAuth 2.0 e clientes HTTP para GA4 Data API, Google Ads API (MCC), Meta Marketing API e Instagram Graph API (`views` + `instagram_midias`), com testes de contrato usando fixtures gravadas.
- [ ] **Geração de PDF Server-Side (Opção A - Seção 12)**: implementar rota de impressão autenticada por token curto de uso único + worker Playwright/Chromium salvando PDF A4 real com marca dinâmica (logo, cores, fonte, rodapé com paginação, última sincronização por fonte) e retorno binário em `GET /api/v1/relatorios/:id/download`.
- [ ] **Gestão de Usuários, Convites e Reset de Senha (RF-09)**: `POST/PATCH /clientes` e aplicação da marca em `Header`/`ReportPrintView`/`TrendChart` concluídos; faltam CRUD de usuários e fluxos de convite/recuperação dependentes de Auth real e SMTP.
- [x] **Substituir dados hardcoded e completar filtros**: `GA4View` alimentado por `GET /api/v1/ga4/origens`, `InstagramView` usando `novosSeguidoresInstagram` real, marca aplicada em `Header`/`ReportPrintView`/`TrendChart`, e intervalo livre + sincronização na URL em `FilterBar`/`FilterContext`.

### Prioridade Baixa (Qualidade, Acessibilidade e Escala)
- [ ] **Testes de Integração BD, E2E e Carga (Seção 14)**: testes HTTP reais contra a API adicionados em `api_hardening_uuid.test.ts`; faltam testes contra PostgreSQL real em container (validando RLS no banco), E2E Playwright e carga `k6`.
- [x] **Acessibilidade (RNF-08) e UX base**: tabela alternativa acessível nos gráficos (`TrendChart` e `ChannelDonutChart`), toasts/confirmação inline substituindo `alert()`/`confirm()`, e code-splitting no Vite eliminando chunks > 500 kB.
- [ ] **LGPD operacional e Observabilidade**: `DELETE /api/v1/clientes/:id/dados` implementado; faltam revogação OAuth externa, logs estruturados (`pino`) e integração com Sentry.

---

## 5. Pendências Dependentes do Usuário / Infraestrutura / Terceiros

Estes itens dependem de contas externas, aprovações de plataformas ou decisões de negócio/infraestrutura:

1. **Google Cloud & Google Ads API**:
   - Criar projeto no Google Cloud em nome da agência; habilitar GA4 Data API e Google Ads API; gerar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
   - Solicitar **Google Ads Developer Token** (acesso Basic/Standard) vinculado à conta gerente (**MCC**) da agência (`GOOGLE_ADS_LOGIN_CUSTOMER_ID`).
2. **Meta Developers (Meta Ads & Instagram Insights)**:
   - Criar App Meta vinculado ao Business Manager da agência; configurar verificação da empresa e App Review para permissões `ads_read` e `instagram_basic` / `instagram_manage_insights`; gerar `META_APP_ID`, `META_APP_SECRET` e `META_SYSTEM_USER_TOKEN`.
3. **Decisões de Regra de Negócio (Seção 18 do PDF)**:
   - Confirmar regra de combinação de receita (GA4 + Entradas Manuais/CRM vs. excludente) e definição oficial do denominador de engajamento no Instagram (`alcance` vs `views`).
   - Definir provedor de e-mail transacional (SMTP/Resend/SES) para convites, recuperação de senha e agendamentos RF-15, e gateway WhatsApp (Evolution API / Z-API) caso seja usado em produção.
4. **Infraestrutura e Secrets (`.env` / Deploy)**:
   - Configurar `.env` local e secrets de produção (`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ENCRYPTION_KEY_AES` com 32 bytes reais, credenciais Google/Meta).
   - Iniciar Docker Desktop localmente (para testar `docker compose up`) e provisionar ambiente remoto (VPS/OCI/AWS + PostgreSQL + Redis + HTTPS/domínio).

---

## 6. Sugestões de Melhorias Técnicas Adicionais

1. **Decimação/Agregação por Granularidade na Série Temporal**: `gerarSerieTemporal` já aceita `granularidade` no schema (`dia | semana | mes`), mas ainda gera apenas pontos diários. Para consultas de 90 dias a 12 meses, agregar no backend por semana/mês reduz payload e melhora legibilidade do Chart.js.
2. **Validação estrita de `.env` na inicialização**: criar `apps/api/src/config/env.ts` com Zod para falhar rápido caso `JWT_SECRET` ou `ENCRYPTION_KEY_AES` estejam ausentes/fracos em `NODE_ENV=production`.
3. **Cache por cliente/janela no Redis**: cachear agregações pesadas de 12 meses com invalidação automática ao concluir sincronização da conta conectada.
4. **Atualização em tempo real por SSE**: evoluir o polling de 60s para Server-Sent Events (`GET /api/v1/eventos/sync`) notificando o front-end assim que um job do BullMQ finalizar.
