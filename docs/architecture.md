# Arquitetura — Pet Com Você

---

## Estilo Arquitetural: Monólito Modular

Um único processo deployável (NestJS) com cinco módulos internos de contexto delimitado. Fronteiras bem definidas via interfaces de serviço e eventos internos. Prepara o sistema para extração futura de microserviços sem reescrever o domínio.

**Por que não microserviços desde o início:**
- Equipe pequena sem overhead de múltiplos deploys
- Dados clínicos exigem consistência transacional ACID (mais simples em monólito)
- Deploy único no Supabase reduz custo operacional
- Fronteiras internas já definidas facilitam extração futura

---

## Camadas do Sistema

```
┌─────────────────────────────────────────────┐
│           Apresentação                       │
│   React.js (web) · React Native (mobile)    │
└──────────────────┬──────────────────────────┘
                   │ HTTP / REST
┌──────────────────▼──────────────────────────┐
│           Aplicação (NestJS)                 │
│   Controllers → Use Cases → Orquestração    │
└──────────────────┬──────────────────────────┘
                   │ Domain calls
┌──────────────────▼──────────────────────────┐
│           Domínio (TypeScript)               │
│   Entidades · Agregados · Regras de Negócio │
└──────────────────┬──────────────────────────┘
                   │ Repository pattern
┌──────────────────▼──────────────────────────┐
│           Persistência                       │
│         PostgreSQL via Supabase              │
└─────────────────────────────────────────────┘
```

**Regra fundamental:** cada camada só fala com a camada imediatamente abaixo. A camada de domínio não conhece nada de infraestrutura (banco, HTTP, WhatsApp).

---

## Módulos Internos

### Módulo: IdentidadeAcesso
`src/modules/identity-access/`

**Responsabilidade:** cadastro de tutores e funcionários, autenticação (JWT), autorização (roles/guards), gerenciamento de sessão.

**Entidades proprietárias:** `Tutor`, `Pet`, `Funcionario`

**Faz:**
- Login e geração de JWT
- Cadastro de tutores e pets
- Cadastro e gestão de funcionários
- Validação de token em middleware global
- Controle de roles (`ADMIN`, `VET`, `GROOMER`, `RECEPTIONIST`, `TUTOR`)

**Não faz:**
- Não acessa dados clínicos
- Não processa pagamentos
- Não conhece lógica de agendamento
- Não gerencia estoque

**Expõe para outros módulos (via interface):**
- `findTutorById(id)` → dados básicos do tutor
- `findPetById(id)` → dados básicos do pet
- `findEmployeeById(id)` → dados básicos do funcionário

---

### Módulo: Clinico
`src/modules/clinical/`

**Responsabilidade:** todo o histórico de saúde do animal — prontuários, vacinas, receituários, laudos e insumos clínicos consumidos em atendimento.

**Entidades proprietárias:** `Prontuario`, `InsumoProntuario`, `RegistroVacinal`

**Faz:**
- Criação e consulta de prontuários
- Registro e consulta de vacinas
- Controle de cartão vacinal digital
- Verificação de validade vacinal (usado pelo módulo de agendamento)
- Publicação do evento `medical-record.closed` ao fechar prontuário

**Não faz:**
- Não gerencia agenda (consome apenas `appointmentId` por referência)
- Não processa cobranças nem pagamentos
- Não conhece produtos de varejo
- Não autentica usuários

**Publica eventos:**
- `medical-record.closed` → consumido por `EstoquePDV`

**Expõe para outros módulos:**
- `getVaccinationStatus(petId)` → status vacinal do pet (usado por `AgendamentoServicos`)

---

### Módulo: AgendamentoServicos
`src/modules/scheduling/`

**Responsabilidade:** agenda do estabelecimento, disponibilidade de profissionais, fila de espera, serviços de banho, tosa e hotelzinho.

**Entidades proprietárias:** `Agendamento`

**Faz:**
- Criação, consulta e atualização de agendamentos
- Verificação de conflitos de agenda
- Validação de vacinas para hotelzinho (via `Clinico.getVaccinationStatus`)
- Gerenciamento de fila de espera
- Ciclo de vida do agendamento (status)

**Não faz:**
- Não registra prontuários (delega ao `Clinico`)
- Não cobra nem processa pagamentos
- Não gerencia estoque

**Publica eventos:**
- `appointment.completed` → consumido por `FinanceiroNotificacoes`

**Consome de outros módulos:**
- `IdentidadeAcesso.findPetById`
- `IdentidadeAcesso.findEmployeeById`
- `Clinico.getVaccinationStatus` (para validação de hotelzinho)

---

### Módulo: EstoquePDV
`src/modules/inventory-pdv/`

**Responsabilidade:** catálogo de produtos, estoque disponível, vendas no PDV, baixa automática de insumos clínicos, alertas de reposição.

**Entidades proprietárias:** `Produto`, `Venda`, `ItemVenda`

**Faz:**
- CRUD de produtos no catálogo
- Controle de quantidade em estoque
- Processamento de vendas (PDV)
- Baixa automática de insumos ao consumir evento `medical-record.closed`
- Alertas internos quando estoque atinge nível mínimo

**Não faz:**
- Não autentica usuários
- Não gerencia prontuários nem consultas
- Não processa pagamentos (delega ao `FinanceiroNotificacoes`)
- Não gerencia agenda

**Consome eventos:**
- `medical-record.closed` → executa baixa de insumos clínicos

**Publica eventos:**
- `inventory.minimum-reached` → consumido por `FinanceiroNotificacoes`

---

### Módulo: FinanceiroNotificacoes
`src/modules/financial-notifications/`

**Responsabilidade:** pagamentos de vendas e serviços, orçamentos, fluxo de caixa, relatórios e notificações automáticas (confirmações, lembretes, preditivas) via WhatsApp e e-mail.

**Entidades proprietárias:** `Orcamento`, `Pagamento`, `Notificacao`

**Faz:**
- Processamento de pagamentos (múltiplos métodos)
- Geração e gerenciamento de orçamentos
- Estornos de pagamento
- Fluxo de caixa e relatórios financeiros
- Envio de notificações WhatsApp e e-mail
- Job preditivo diário (notificação de recompra de ração)
- Lembretes de vacina (30 dias antes)

**Não faz:**
- Não cria nem edita produtos
- Não acessa ou modifica prontuários
- Não gerencia agenda
- Não autentica usuários

**Consome eventos:**
- `appointment.completed` → gera notificações pós-atendimento
- `inventory.minimum-reached` → gera alerta interno para administrador

---

## Comunicação entre Módulos

### REST Síncrono (resposta imediata)

Usado quando o resultado influencia diretamente o fluxo do usuário:

| Operação | Chamante | Provedor |
|---|---|---|
| Verificar status vacinal do pet | `AgendamentoServicos` | `Clinico` |
| Buscar dados do pet | `AgendamentoServicos` | `IdentidadeAcesso` |
| Buscar dados do funcionário | `AgendamentoServicos` | `IdentidadeAcesso` |

### Eventos Assíncronos (EventEmitter2 do NestJS)

Usado para efeitos colaterais que não precisam bloquear o fluxo principal:

| Evento | Publicado por | Consumido por | Quando |
|---|---|---|---|
| `medical-record.closed` | `Clinico` | `EstoquePDV` | Prontuário fechado — baixa de insumos |
| `appointment.completed` | `AgendamentoServicos` | `FinanceiroNotificacoes` | Serviço concluído — notificações pós-atendimento |
| `inventory.minimum-reached` | `EstoquePDV` | `FinanceiroNotificacoes` | Estoque mínimo atingido — alerta ao admin |

**Regra:** módulos nunca acessam diretamente o banco de dados uns dos outros. Comunicação sempre via interface de serviço ou evento.

---

## Estrutura de Pastas do Projeto

```
pet-com-voce-api/
├── src/
│   ├── modules/
│   │   ├── identity-access/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   └── services/
│   │   │   ├── application/
│   │   │   │   ├── use-cases/
│   │   │   │   └── dtos/
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   └── controllers/
│   │   │   └── identity-access.module.ts
│   │   ├── clinical/
│   │   ├── scheduling/
│   │   ├── inventory-pdv/
│   │   └── financial-notifications/
│   ├── shared/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── types/
│   ├── config/
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── test/
└── package.json
```

---

## Stack Tecnológica — Decisões e Justificativas

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Backend | NestJS (Node.js + TypeScript) | Módulos nativos alinhados com a arquitetura; TypeScript por padrão; DI container nativo |
| Frontend Web | React.js | Ecossistema maduro; ampla adoção para contratação |
| App Móvel | React Native | Reaproveitamento de código com web; iOS e Android com um codebase |
| Banco de Dados | PostgreSQL via Supabase | Relacional robusto para dados clínicos e financeiros; Supabase inclui auth, storage e realtime |
| ORM | Prisma | Type-safe, migrations automáticas, integração nativa com NestJS |
| Notificações | WhatsApp Business API | Canal de maior penetração no Brasil para comunicação com tutores |
| Eventos internos | EventEmitter2 (NestJS) | Sem overhead de infraestrutura externa no MVP; substituível por Redis/RabbitMQ na Fase 2 |
| Deploy | Railway / Render | Simplicidade operacional; custo baixo no MVP |

---

## Roadmap de Evolução

### Fase 1 — Monólito Modular (atual)

**Objetivo:** validar produto com mercado, cobrir fluxos essenciais, gerar receita.

- Aplicação única em NestJS com módulos bem definidos
- Banco de dados único no Supabase (PostgreSQL)
- Comunicação interna via `EventEmitter2`
- Deploy em Railway ou similar

**Todos os módulos ativos:** `IdentidadeAcesso`, `Clinico`, `AgendamentoServicos`, `EstoquePDV`, `FinanceiroNotificacoes`

---

### Fase 2 — Extração do Serviço de Notificações

**Trigger:** volume de notificações WhatsApp impacta latência da aplicação principal.

- `FinanceiroNotificacoes` extraído como serviço independente
- Comunicação via fila de mensagens: **Redis Pub/Sub** ou **RabbitMQ**
- Monólito publica na fila; serviço de notificações consome de forma assíncrona
- Lógica preditiva (ciclos de recompra) vira worker isolado com schedule próprio

**Benefício:** desempenho do fluxo principal desacoplado do volume de notificações.

---

### Fase 3 — Decomposição em Microserviços

**Trigger:** modelo SaaS multi-tenant, demanda por escala diferenciada por módulo, ou crescimento para times independentes.

- Cada módulo vira microserviço com banco de dados isolado
- API Gateway para roteamento e autenticação centralizada
- Kubernetes para orquestração de containers
- Event Sourcing no `Clinico` (rastreabilidade total de mudanças no prontuário)

**Serviços independentes:**

| Serviço | Banco | Observação |
|---|---|---|
| Identidade e Acesso | PostgreSQL | Multi-tenant support |
| Clínico | PostgreSQL | Event Sourcing para prontuários |
| Agendamento | PostgreSQL | Escalonamento horizontal |
| Estoque e PDV | PostgreSQL | — |
| Financeiro | PostgreSQL | — |
| Notificações e IA Preditiva | Redis + PostgreSQL | Worker dedicado |

---

### Tabela Comparativa das Fases

| Aspecto | Fase 1 — Monólito | Fase 2 — Notificações Isoladas | Fase 3 — Microserviços |
|---|---|---|---|
| Unidades deployáveis | 1 | 2 | 6+ |
| Banco de dados | Único (Supabase) | Compartilhado + Redis | Isolado por serviço |
| Comunicação | EventEmitter2 interno | Fila (Redis/RabbitMQ) | Event Bus + API Gateway |
| Complexidade operacional | Baixa | Média | Alta |
| Custo de infraestrutura | Baixo | Médio | Alto |
| Escalabilidade | Vertical | Parcialmente horizontal | Horizontal por serviço |

---

## Segurança

- **Autenticação:** JWT com expiração curta (1h) + refresh token
- **Autorização:** Guards por role em cada controller
- **Dados sensíveis:** prontuários e dados financeiros acessíveis apenas por roles autorizados
- **Senhas:** hash com bcrypt (custo mínimo 12)
- **HTTPS:** obrigatório em produção
- **Rate limiting:** aplicar em endpoints de login e notificações
