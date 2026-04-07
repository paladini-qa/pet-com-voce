# AGENTS — Referência de Desenvolvimento

Guia rápido de convenções, padrões e restrições para agentes desenvolvedores do **Pet Com Você**.

Antes de implementar qualquer feature, leia também:
- [`docs/domain.md`](./docs/domain.md) — modelo de domínio completo
- [`docs/architecture.md`](./docs/architecture.md) — módulos e fronteiras
- [`docs/api.md`](./docs/api.md) — contratos de API
- [`docs/flows.md`](./docs/flows.md) — fluxos do sistema

---

## Convenções de Código

### Linguagem e Nomenclatura
- Código em **inglês** (variáveis, funções, classes, arquivos)
- Comentários e mensagens de erro para o usuário em **português**
- Nomes de entidades: PascalCase (`PetRecord`, `ScheduledAppointment`)
- Nomes de eventos: PascalCase com sufixo `Event` (`MedicalRecordClosedEvent`)
- Nomes de enums: UPPER_SNAKE_CASE para valores (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`)
- Endpoints REST: kebab-case, plural, substantivos (`/scheduled-appointments`, `/medical-records`)

### Valores Monetários
- **SEMPRE** armazenar em centavos como inteiro (`integer`, não `decimal` ou `float`)
- Nome da coluna: `valor_centavos`, `total_centavos`, `preco_centavos`
- Nunca usar `float` ou `double` para valores financeiros
- Converter para exibição apenas na camada de apresentação

### Identificadores
- Todos os IDs são **UUID v4**
- Coluna: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- Referências externas: `pet_id UUID NOT NULL REFERENCES pets(id)`

### Timestamps
- Usar `timestamptz` (timestamp com timezone) no PostgreSQL
- Coluna padrão: `created_at`, `updated_at`
- Adicionar `updated_at` com trigger de auto-update em todas as tabelas

---

## Módulos — Regras de Fronteira

Cada módulo só acessa seu próprio banco de dados. Comunicação entre módulos via interface de serviço ou evento. **NUNCA** importar repositórios ou entidades de domínio de outro módulo.

| Módulo NestJS | Pasta |
|---|---|
| IdentidadeAcesso | `src/modules/identity-access/` |
| Clinico | `src/modules/clinical/` |
| AgendamentoServicos | `src/modules/scheduling/` |
| EstoquePDV | `src/modules/inventory-pdv/` |
| FinanceiroNotificacoes | `src/modules/financial-notifications/` |

### Estrutura Interna de Cada Módulo

```
src/modules/<module>/
├── domain/
│   ├── entities/          # Entidades de domínio
│   ├── events/            # Eventos publicados pelo módulo
│   └── services/          # Regras de negócio (domain services)
├── application/
│   ├── use-cases/         # Casos de uso (um arquivo por caso de uso)
│   └── dtos/              # DTOs de entrada e saída
├── infrastructure/
│   ├── repositories/      # Implementação dos repositórios (Prisma/TypeORM)
│   └── controllers/       # Controllers HTTP
└── <module>.module.ts
```

---

## Eventos Internos (Assíncronos)

Use `EventEmitter2` do NestJS. Os eventos abaixo estão definidos e devem ser respeitados:

| Evento | Publicado por | Consumido por | Payload mínimo |
|---|---|---|---|
| `medical-record.closed` | `Clinico` | `EstoquePDV` | `{ appointmentId, suppliesUsed: [{ productId, quantity }] }` |
| `appointment.completed` | `AgendamentoServicos` | `FinanceiroNotificacoes` | `{ appointmentId, petId, tutorId }` |
| `inventory.minimum-reached` | `EstoquePDV` | `FinanceiroNotificacoes` | `{ productId, productName, currentQuantity, minimumQuantity }` |

---

## Status dos Agregados

### Agendamento
```
SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
                    ↓
                CANCELLED
                    ↓
              NO_SHOW
```

### Orçamento (Budget)
```
PENDING → APPROVED → (pagamento processado)
       → REJECTED
       → EXPIRED
```

### Venda (Sale)
```
OPEN → COMPLETED
    → CANCELLED
```

### Pagamento (Payment)
```
PENDING → APPROVED
       → REJECTED
       → REFUNDED  (operação explícita obrigatória)
```

### Notificação
```
SENT → DELIVERED → READ
    → FAILED
```

---

## Regras Críticas de Domínio (Invariantes)

Estas regras **nunca podem ser violadas** — implementar validação na camada de domínio:

1. **Consentimento financeiro:** serviço só inicia com orçamento aprovado (`APPROVED`)
2. **Vacinas para hotelzinho:** agendamento do tipo `HOTEL` bloqueado se antirrábica ou múltipla (V10) estiverem vencidas
3. **Estoque negativo proibido:** venda bloqueada se `quantidadeEmEstoque < quantidadeRequisitada`
4. **Pagamento aprovado imutável:** status `APPROVED` não pode ser alterado diretamente; estorno exige operação `refund` explícita
5. **Prontuário restrito:** apenas o veterinário vinculado ao agendamento pode editar o prontuário após criação
6. **Baixa automática:** ao fechar prontuário, publicar `medical-record.closed` — o módulo de estoque processa a baixa

---

## Autenticação e Autorização

- JWT Bearer Token em todas as rotas protegidas
- Middleware de autenticação aplicado **antes** de chegar nos módulos de negócio
- Roles disponíveis: `ADMIN`, `VET`, `GROOMER`, `RECEPTIONIST`, `TUTOR`
- Guard de autorização por cargo nas rotas sensíveis:
  - `POST /medical-records` — apenas `VET`
  - `POST /vaccines` — apenas `VET`
  - `DELETE /appointments` — apenas `ADMIN`
  - `GET /pets/:id/history` — `VET`, `ADMIN`, `RECEPTIONIST` ou tutor dono do pet

---

## Padrões de Resposta da API

### Sucesso
```json
{
  "data": { ... },
  "meta": { "timestamp": "2024-01-01T10:00:00Z" }
}
```

### Erro de Validação (400)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Campos obrigatórios ausentes",
  "details": [{ "field": "petId", "message": "campo obrigatório" }]
}
```

### Erro de Negócio (422)
```json
{
  "error": "BUSINESS_RULE_VIOLATION",
  "message": "Estoque insuficiente para o produto solicitado",
  "details": { "productId": "uuid", "available": 2, "requested": 5 }
}
```

### Não Encontrado (404)
```json
{
  "error": "NOT_FOUND",
  "message": "Agendamento não encontrado"
}
```

---

## Banco de Dados

- **PostgreSQL** via **Supabase**
- ORM: **Prisma** (preferido) ou TypeORM
- Nomenclatura das tabelas: snake_case, plural (`pets`, `appointments`, `medical_records`)
- Nomenclatura das colunas: snake_case (`pet_id`, `created_at`, `is_clinical_supply`)
- Toda tabela deve ter: `id`, `created_at`, `updated_at`
- Soft delete onde aplicável: coluna `deleted_at timestamptz NULL`

---

## Notificações WhatsApp

- Usar **WhatsApp Business API**
- Disparos assíncronos — nunca bloquear o fluxo principal aguardando confirmação de entrega
- Job diário (cron) para:
  - Lembretes vacinais: 30 dias antes de `data_proxima_dose`
  - Notificação preditiva de ração: 5 dias antes do fim estimado do produto

---

## O Que NÃO Fazer

- Não acessar tabelas de outro módulo diretamente via SQL/ORM
- Não usar `float` para valores monetários
- Não reutilizar entidades de domínio entre módulos (copiar apenas IDs)
- Não processar pagamentos antes de orçamento aprovado
- Não permitir edição de pagamentos com status `APPROVED` (apenas `refund` explícito)
- Não registrar prontuário para agendamento que não está `IN_PROGRESS`
- Não bloquear o fluxo principal com operações de notificação síncrona
