# Contratos de API — Pet Com Você

Base URL: `/api/v1`

Autenticação: `Authorization: Bearer <jwt_token>` em todos os endpoints (exceto login).

Valores monetários: sempre em **centavos** (integer) na API. Conversão apenas na apresentação.

---

## Módulo: Identidade e Acesso

### POST /auth/login
Autenticar usuário (funcionário ou tutor).

**Entrada:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Saída (200):**
```json
{
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "nome": "string",
      "role": "VET | ADMIN | RECEPTIONIST | GROOMER | TUTOR"
    }
  }
}
```

---

### POST /tutors
Cadastrar novo tutor.

**Roles permitidos:** `ADMIN`, `RECEPTIONIST`

**Entrada:**
```json
{
  "nome": "string",
  "email": "string",
  "telefone": "string",
  "whatsapp": "string",
  "cpf": "string",
  "endereco": "string"
}
```

**Saída (201):** objeto `Tutor` criado.

---

### POST /pets
Cadastrar novo pet vinculado a um tutor.

**Roles permitidos:** `ADMIN`, `RECEPTIONIST`

**Entrada:**
```json
{
  "tutorId": "uuid",
  "nome": "string",
  "especie": "DOG | CAT | BIRD | REPTILE | OTHER",
  "raca": "string",
  "dataNascimento": "date (YYYY-MM-DD)",
  "peso": "number",
  "sexo": "MALE | FEMALE",
  "castrado": "boolean",
  "observacoes": "string"
}
```

**Saída (201):** objeto `Pet` criado.

---

## Módulo: Agendamento e Serviços

### POST /appointments
Criar novo agendamento.

**Roles permitidos:** `ADMIN`, `RECEPTIONIST`

**Entrada:**
```json
{
  "petId": "uuid",
  "funcionarioId": "uuid",
  "tipo": "CONSULTATION | BATH | GROOMING | BATH_GROOMING | HOTEL | RETURN",
  "dataHora": "datetime (ISO 8601)",
  "duracao": "integer (minutos)",
  "observacoes": "string"
}
```

**Processamento:**
1. Valida existência de `petId` e `funcionarioId`
2. Verifica conflitos de agenda: agendamentos com status `SCHEDULED`, `CONFIRMED` ou `IN_PROGRESS` no mesmo horário para o mesmo funcionário
3. Se `tipo = HOTEL`: valida `vaccination_records` do pet — antirrábica e múltipla (V10) devem estar com `data_proxima_dose > hoje`
4. Cria `Appointment` com status `SCHEDULED`
5. Enfileira notificação de confirmação para o tutor

**Saída (201):**
```json
{
  "data": {
    "id": "uuid",
    "status": "SCHEDULED",
    "petId": "uuid",
    "funcionarioId": "uuid",
    "tipo": "CONSULTATION",
    "dataHora": "datetime"
  }
}
```

**Erros:**
- `400` — campos obrigatórios ausentes
- `404` — pet ou funcionário não encontrado
- `409` — conflito de agenda no horário solicitado
- `422` — vacinas obrigatórias vencidas ou ausentes (hotelzinho)

---

### PATCH /appointments/:id/status
Atualizar status do agendamento.

**Roles permitidos:** `ADMIN`, `RECEPTIONIST`

**Entrada:**
```json
{
  "status": "CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW"
}
```

**Restrições de transição:**
- `SCHEDULED → CONFIRMED | CANCELLED`
- `CONFIRMED → IN_PROGRESS | CANCELLED | NO_SHOW`
- `IN_PROGRESS → COMPLETED | CANCELLED`
- `COMPLETED` e `CANCELLED` são estados finais

**Saída (200):** objeto `Appointment` atualizado.

---

### GET /appointments
Listar agendamentos com filtros.

**Roles permitidos:** todos autenticados

**Query params:** `petId`, `funcionarioId`, `data` (YYYY-MM-DD), `status`, `tipo`

**Saída (200):** lista paginada de agendamentos.

---

## Módulo: Clínico

### POST /appointments/:id/medical-record
Registrar prontuário de atendimento.

**Roles permitidos:** `VET` (apenas o vinculado ao agendamento)

**Entrada:**
```json
{
  "anamnese": "string",
  "exameClinico": "string",
  "diagnostico": "string",
  "prescricao": "string",
  "retornoRecomendado": "date (YYYY-MM-DD)",
  "insumosUtilizados": [
    { "produtoId": "uuid", "quantidade": "integer", "observacoes": "string" }
  ]
}
```

**Processamento:**
1. Valida que o agendamento existe e está com status `IN_PROGRESS`
2. Valida que o veterinário autenticado é o `funcionarioId` do agendamento
3. Cria `MedicalRecord` com `InsumoProntuario[]`
4. Publica evento `medical-record.closed` com `suppliesUsed[]`
5. `EstoquePDV` consome o evento e executa baixa de cada insumo

**Saída (201):**
```json
{
  "data": {
    "id": "uuid",
    "petId": "uuid",
    "appointmentId": "uuid",
    "diagnostico": "string",
    "stockAlerts": [
      { "productId": "uuid", "productName": "string", "currentQuantity": 2 }
    ]
  }
}
```

---

### GET /pets/:id/medical-records
Histórico clínico completo do pet.

**Roles permitidos:** `VET`, `ADMIN`, `RECEPTIONIST`, tutor dono do pet

**Query params:** `dataInicio` (YYYY-MM-DD), `dataFim` (YYYY-MM-DD)

**Saída (200):** lista de prontuários ordenados cronologicamente.

---

### POST /pets/:id/vaccines
Registrar aplicação de vacina.

**Roles permitidos:** `VET`

**Entrada:**
```json
{
  "vacinaId": "uuid",
  "dataAplicacao": "date (YYYY-MM-DD)",
  "lote": "string",
  "dataProximaDose": "date (YYYY-MM-DD)",
  "observacoes": "string"
}
```

**Processamento:**
1. Valida existência do pet e do produto-vacina
2. Valida que veterinário está autenticado e `ativo = true`
3. Cria `VaccinationRecord`
4. Agenda notificação de lembrete para 30 dias antes de `dataProximaDose`
5. Decrementa estoque do produto-vacina

**Saída (201):** objeto `VaccinationRecord` criado.

---

### GET /pets/:id/vaccines
Cartão vacinal digital do pet.

**Roles permitidos:** `VET`, `ADMIN`, `RECEPTIONIST`, tutor dono do pet

**Saída (200):**
```json
{
  "data": {
    "petId": "uuid",
    "vaccines": [
      {
        "id": "uuid",
        "vacinaNome": "Antirrábica",
        "dataAplicacao": "2024-01-15",
        "dataProximaDose": "2025-01-15",
        "status": "UP_TO_DATE | EXPIRED | MISSING"
      }
    ]
  }
}
```

---

## Módulo: Estoque e PDV

### POST /sales
Processar venda no PDV.

**Roles permitidos:** `ADMIN`, `RECEPTIONIST`

**Entrada:**
```json
{
  "funcionarioId": "uuid",
  "tutorId": "uuid (opcional — venda avulsa)",
  "itens": [
    { "produtoId": "uuid", "quantidade": "integer" }
  ],
  "metodoPagamento": "CASH | DEBIT_CARD | CREDIT_CARD | PIX | BOLETO",
  "descontoCentavos": "integer (opcional, default 0)"
}
```

**Processamento:**
1. Para cada item: valida existência e estoque suficiente (`quantidadeEmEstoque >= quantidade`)
2. Calcula `precoUnitarioCentavos` do momento atual para cada item
3. Calcula `subtotal`, aplica desconto, calcula `total`
4. Cria `Sale` com `SaleItem[]`
5. Decrementa estoque de cada produto vendido
6. Verifica alertas de estoque mínimo
7. Processa `Payment` vinculado
8. Atualiza `Sale.status` para `COMPLETED`

**Saída (201):**
```json
{
  "data": {
    "id": "uuid",
    "totalCentavos": 15000,
    "status": "COMPLETED",
    "payment": { "id": "uuid", "status": "APPROVED", "metodo": "PIX" },
    "stockAlerts": []
  }
}
```

**Erros:**
- `422` — estoque insuficiente: `{ "error": "INSUFFICIENT_STOCK", "details": { "productId": "uuid", "available": 2, "requested": 5 } }`

---

### POST /products
Cadastrar novo produto no catálogo.

**Roles permitidos:** `ADMIN`

**Entrada:**
```json
{
  "nome": "string",
  "descricao": "string",
  "categoria": "FOOD | MEDICINE | ACCESSORY | CLINICAL_SUPPLY | HYGIENE",
  "precoCentavos": "integer",
  "custoUnitarioCentavos": "integer",
  "quantidadeEmEstoque": "integer",
  "quantidadeMinima": "integer",
  "dataValidade": "date (opcional)",
  "sku": "string",
  "usoClinico": "boolean"
}
```

**Saída (201):** objeto `Product` criado.

---

### POST /products/:id/stock-entry
Registrar entrada de produto no estoque (reposição).

**Roles permitidos:** `ADMIN`

**Entrada:**
```json
{
  "funcionarioId": "uuid",
  "quantidade": "integer",
  "custoUnitarioCentavos": "integer",
  "dataValidade": "date (opcional)",
  "notaFiscal": "string (opcional)"
}
```

**Processamento:**
1. Valida permissão de gestão de estoque
2. Incrementa `quantidadeEmEstoque`
3. Atualiza `custoUnitarioCentavos` e `dataValidade` se fornecidos
4. Remove alertas de reposição pendentes para o produto

**Saída (200):** produto com estoque atualizado.

---

### GET /products
Listar produtos com filtros.

**Query params:** `categoria`, `usoClinico` (boolean), `estoqueAbaixoDoMinimo` (boolean)

**Saída (200):** lista paginada de produtos.

---

## Módulo: Financeiro e Notificações

### PATCH /budgets/:id/response
Tutor aprova ou recusa orçamento.

**Roles permitidos:** `TUTOR` (apenas o tutor vinculado ao orçamento)

**Entrada:**
```json
{
  "decisao": "APPROVED | REJECTED",
  "motivoRecusa": "string (obrigatório se decisao = REJECTED)"
}
```

**Processamento:**
1. Valida que o orçamento pertence ao tutor autenticado
2. Valida que o orçamento está com status `PENDING`
3. Atualiza status para `APPROVED` ou `REJECTED`
4. Se aprovado: notifica funcionário responsável para prosseguir
5. Se recusado: notifica funcionário com motivo e aguarda nova instrução

**Saída (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "APPROVED | REJECTED",
    "dataResposta": "datetime"
  }
}
```

**Erros:**
- `403` — orçamento não pertence ao tutor autenticado
- `422` — orçamento não está com status `PENDING`

---

### POST /payments/:id/refund
Estornar pagamento aprovado.

**Roles permitidos:** `ADMIN`

**Entrada:**
```json
{
  "motivo": "string"
}
```

**Processamento:** cria novo registro de pagamento com status `REFUNDED` vinculado ao pagamento original. O pagamento original permanece imutável com status `APPROVED`.

**Saída (201):** registro de estorno criado.

---

## Endpoint Agregado: Histórico Completo do Pet

### GET /pets/:id/history
Histórico 360° do pet em um único endpoint.

**Roles permitidos:** `VET`, `ADMIN`, `RECEPTIONIST`, tutor dono do pet

**Query params:**
- `dataInicio` — YYYY-MM-DD (opcional)
- `dataFim` — YYYY-MM-DD (opcional)
- `tipo` — `clinical | services | vaccines | financial` (opcional, retorna tudo se omitido)

**Processamento:** agrega dados de `MedicalRecords`, `VaccinationRecords`, `Appointments` e `Sales` do tutor. Ordena cronologicamente.

**Saída (200):**
```json
{
  "data": {
    "pet": { "id": "uuid", "nome": "string", "especie": "DOG" },
    "medicalRecords": [ ... ],
    "vaccinationCard": [ ... ],
    "appointments": [ ... ],
    "purchases": [ ... ]
  }
}
```

---

## Códigos de Status HTTP

| Código | Significado |
|---|---|
| `200` | Sucesso — retorna dados atualizados |
| `201` | Criado com sucesso |
| `400` | Campos obrigatórios ausentes ou inválidos |
| `401` | Token ausente ou inválido |
| `403` | Sem permissão para o recurso |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: agenda ocupada) |
| `422` — Regra de negócio violada (ex: estoque insuficiente, vacina vencida, pagamento já aprovado) |

---

## Paginação

Todos os endpoints de listagem (`GET` com resultado múltiplo) seguem o padrão:

**Query params:** `page` (default: 1), `limit` (default: 20, max: 100)

**Resposta:**
```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```
