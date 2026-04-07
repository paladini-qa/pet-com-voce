# Fluxos do Sistema — Pet Com Você

---

## Fluxo Principal: Consulta Veterinária Completa

O fluxo mais representativo do domínio. Envolve todos os módulos e os três atores principais.

### Etapa 1 — Agendamento da Consulta

| Campo | Valor |
|---|---|
| **Ator** | Administrador ou Tutor (via app) |
| **Módulo** | `AgendamentoServicos` |
| **Entrada** | `petId`, `funcionarioId`, `tipo: CONSULTATION`, `dataHora` |
| **Processamento** | Verifica disponibilidade do veterinário no horário → cria `Agendamento` com status `SCHEDULED` |
| **Saída** | Agendamento criado → notificação de confirmação enfileirada para o Tutor (WhatsApp) |

---

### Etapa 2 — Check-in no Dia do Atendimento

| Campo | Valor |
|---|---|
| **Ator** | Recepcionista / Administrador |
| **Módulo** | `AgendamentoServicos` |
| **Entrada** | `appointmentId` |
| **Processamento** | Atualiza status do Agendamento para `IN_PROGRESS` → carrega histórico clínico anterior do pet |
| **Saída** | Veterinário visualiza prontuários anteriores do pet |

---

### Etapa 3 — Registro do Prontuário

| Campo | Valor |
|---|---|
| **Ator** | Veterinário |
| **Módulo** | `Clinico` |
| **Entrada** | `appointmentId`, `anamnese`, `exameClinico`, `diagnostico`, `prescricao`, `insumosUtilizados[]`, `retornoRecomendado` |
| **Processamento** | Valida que agendamento está `IN_PROGRESS` → valida que veterinário autenticado é o responsável → cria `Prontuario` vinculado ao pet e ao agendamento |
| **Saída** | Prontuário criado e vinculado ao pet |

---

### Etapa 4 — Baixa Automática de Insumos (Sistema)

| Campo | Valor |
|---|---|
| **Ator** | Sistema (automático — gatilhado pelo fechamento do prontuário) |
| **Módulo** | `Clinico` (publica) → `EstoquePDV` (consome) |
| **Evento** | `medical-record.closed` |
| **Payload** | `{ medicalRecordId, appointmentId, suppliesUsed: [{ productId, quantity }] }` |
| **Processamento** | Para cada insumo: decrementa `quantidadeEmEstoque` → se atingir `quantidadeMinima`, publica `inventory.minimum-reached` |
| **Saída** | Estoque atualizado automaticamente; alertas de reposição gerados (se aplicável) |

---

### Etapa 5 — Geração e Aprovação de Orçamento

| Campo | Valor |
|---|---|
| **Ator** | Veterinário / Administrador (gera) → Tutor (aprova) |
| **Módulo** | `FinanceiroNotificacoes` |
| **Entrada** | `appointmentId`, `petId`, `tutorId`, `itens[]` com valores |
| **Processamento** | Cria `Orcamento` com status `PENDING` → envia notificação WhatsApp ao Tutor com link de aprovação → Tutor aprova ou recusa |
| **Saída (aprovado)** | Orçamento com status `APPROVED` → fluxo continua para Etapa 6 |
| **Saída (recusado)** | Orçamento com status `REJECTED` → fluxo desvia para [Fluxo Secundário 1](#fluxo-secundario-1--orcamento-recusado) |

---

### Etapa 6 — Processamento do Pagamento

| Campo | Valor |
|---|---|
| **Ator** | Administrador / Recepcionista |
| **Módulo** | `FinanceiroNotificacoes` |
| **Entrada** | `appointmentId`, `metodoPagamento`, `valorCentavos` |
| **Processamento** | Valida ausência de pagamento anterior aprovado → cria `Pagamento` vinculado ao agendamento → processa via método escolhido → atualiza agendamento para `COMPLETED` |
| **Saída** | Pagamento com status `APPROVED`; agendamento `COMPLETED` |

---

### Etapa 7 — Agendamento de Retorno e Notificações (Sistema)

| Campo | Valor |
|---|---|
| **Ator** | Sistema (automático — gatilhado pelo evento `appointment.completed`) |
| **Módulo** | `FinanceiroNotificacoes` |
| **Evento** | `appointment.completed` |
| **Processamento** | Lê `retornoRecomendado` e datas de vacinas do prontuário → agenda notificações futuras na fila |
| **Saída** | Lembretes criados; tutor será notificado automaticamente |

---

## Fluxo Secundário 1 — Orçamento Recusado

**Acionado quando:** Tutor recusa a proposta financeira na Etapa 5 do fluxo principal.

| Passo | Ator | Ação |
|---|---|---|
| 1 | Tutor | Recusa orçamento via app ou presencialmente |
| 2 | Sistema | Atualiza `Orcamento.status` para `REJECTED` |
| 3 | Sistema | Notifica veterinário/recepcionista sobre a recusa com motivo |
| 4 | Funcionário | Decide: (a) revisar valores ou (b) cancelar atendimento |

**Caminho A — Novo Orçamento:**
- Funcionário ajusta valores e gera novo `Orcamento` com status `PENDING`
- Fluxo retorna ao início da Etapa 5

**Caminho B — Cancelamento:**
- Sistema atualiza `Agendamento.status` para `CANCELLED`
- Horário liberado na agenda
- Tutor notificado sobre o cancelamento

**Resultado:** agendamento cancelado ou novo orçamento enviado para nova avaliação.

---

## Fluxo Secundário 2 — Bloqueio por Vacinas Desatualizadas (Hotelzinho)

**Acionado quando:** tentativa de agendar serviço do tipo `HOTEL` com cartão vacinal desatualizado.

| Passo | Ator | Ação |
|---|---|---|
| 1 | Administrador | Inicia agendamento do tipo `HOTEL` |
| 2 | Sistema | Consulta `vaccination_records` do pet |
| 3 | Sistema | Detecta que antirrábica e/ou múltipla (V10) estão vencidas ou ausentes |
| 4 | Sistema | Bloqueia criação do agendamento (HTTP 422) com lista de vacinas pendentes |
| 5 | Administrador | Informa tutor sobre o bloqueio |
| 6 | Tutor | Agenda consulta de vacinação previamente |
| 7 | Sistema | Após vacinação registrada no prontuário, libera agendamento de hotelzinho |

**Resultado:** agendamento de hotelzinho impedido até regularização vacinal.

**Resposta de erro:**
```json
{
  "error": "BUSINESS_RULE_VIOLATION",
  "message": "Agendamento de hotelzinho bloqueado: vacinas obrigatórias desatualizadas",
  "details": {
    "pendingVaccines": [
      { "name": "Antirrábica", "lastDose": "2022-01-15", "status": "EXPIRED" },
      { "name": "Múltipla V10", "lastDose": null, "status": "MISSING" }
    ]
  }
}
```

---

## Fluxo Secundário 3 — Notificação Preditiva de Ração

**Acionado por:** job diário agendado (cron) do módulo `FinanceiroNotificacoes`.

| Passo | Ator | Ação |
|---|---|---|
| 1 | Sistema (cron diário) | Analisa histórico de compras de cada tutor |
| 2 | Sistema | Para cada produto recorrente, calcula intervalo médio entre compras |
| 3 | Sistema | Calcula data estimada de esgotamento com base na última compra + intervalo médio |
| 4 | Sistema | Quando restam ≤ 5 dias, gera `Notificacao` do tipo `FOOD_RESTOCK` |
| 5 | Sistema | Envia WhatsApp com link de pagamento integrado para recompra imediata |
| 6 | Tutor | Clica no link, confirma quantidade e realiza pagamento |
| 7 | Sistema | Registra nova `Venda`, atualiza histórico e recalcula próximo ciclo |

**Resultado:** tutor notificado no momento ideal; recorrência garantida sem esforço manual.

---

## Fluxo Secundário 4 — Venda no PDV (Sem Consulta)

**Acionado quando:** tutor compra produtos no balcão sem agendamento associado.

| Passo | Ator | Ação |
|---|---|---|
| 1 | Recepcionista / Gerente | Abre nova venda no PDV |
| 2 | Sistema | Valida estoque disponível para cada item |
| 3 | Recepcionista | Seleciona produtos e quantidades |
| 4 | Sistema | Calcula subtotal, desconto e total |
| 5 | Recepcionista | Seleciona método de pagamento |
| 6 | Sistema | Processa pagamento → atualiza estoque → finaliza venda |
| 7 | Sistema | Gera comprovante e atualiza histórico de compras do tutor |

**Resultado:** venda concluída, estoque decrementado, comprovante emitido.

---

## Fluxo Secundário 5 — Alerta e Reposição de Estoque

**Acionado quando:** `quantidadeEmEstoque` atinge `quantidadeMinima` após qualquer baixa.

| Passo | Ator | Ação |
|---|---|---|
| 1 | Sistema | Detecta `quantidadeEmEstoque ≤ quantidadeMinima` após baixa |
| 2 | Sistema | Publica evento `inventory.minimum-reached` |
| 3 | Módulo `FinanceiroNotificacoes` | Consome evento e gera alerta interno para administrador |
| 4 | Administrador | Realiza pedido de reposição ao fornecedor |
| 5 | Funcionário | Registra entrada do produto via `POST /products/:id/stock-entry` |
| 6 | Sistema | Incrementa estoque, remove alerta pendente do produto |

**Resultado:** administrador alertado a tempo; estoque normalizado.

---

## Camadas Envolvidas por Fluxo

| Fluxo | Apresentação | Aplicação | Domínio | Persistência |
|---|---|---|---|---|
| Consulta veterinária completa | React.js / App | NestJS | TypeScript domain entities | Supabase/PostgreSQL |
| Aprovação de orçamento | App (Tutor) | NestJS | Budget aggregate | PostgreSQL |
| Baixa de insumos | — (sistema) | NestJS EventEmitter | Domain rules | PostgreSQL |
| Notificação preditiva | — (cron) | NestJS Scheduler | — | WhatsApp API |
| Venda no PDV | React.js | NestJS | Sale aggregate | PostgreSQL |
